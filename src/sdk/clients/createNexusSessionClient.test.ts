import {
  http,
  type Account,
  type Address,
  type Chain,
  createWalletClient,
  toHex,
  toBytes,
  Hex
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../test/testSetup"
import { fundAndDeployClients, getTestAccount, killNetwork, toTestClient } from "../../test/testUtils"
import { PublicClient } from "viem"
import type { MasterClient, NetworkConfig } from "../../test/testUtils"
import { createNexusClient, type NexusClient } from "./createNexusClient"
import { createNexusSessionClient } from "./createNexusSessionClient"
import addresses from "../__contracts/addresses"
import { CreateSessionDataParams } from "../modules/validators/smartSessionValidator/Types"
import { TEST_CONTRACTS } from "../../test/callDatas"
import { smartSessionValidatorActions } from "../modules/validators/smartSessionValidator/decorators"
import { isSessionEnabled } from "../modules/validators/smartSessionValidator/Helper"
import { toNexusAccount } from "../account/toNexusAccount"
import { encodePacked } from "viem"
import { toSmartSessionValidatorModule } from "../modules/validators/smartSessionValidator/tosmartSessionValidatorModule"
import { CounterAbi } from "../../test/__contracts/abi"
import { encodeFunctionData } from "viem"
import { useSession } from "../modules/validators/smartSessionValidator/decorators/useSession"

describe("nexus.client", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: Account
  let recipientAccount: Account
  let recipientAddress: Address
  let cachedPermissionId: Hex
  let nexusClient: NexusClient

  const dummyAddress = "0xf0479e036343bC66dc49dd374aFAF98402D0Ae5f"

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    recipientAccount = getTestAccount(1)
    recipientAddress = recipientAccount.address

    testClient = toTestClient(chain, getTestAccount(5))

    const sessionClient = createWalletClient({
      account: eoaAccount,
      chain,
      transport: http()
    })

    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
    })

    await fundAndDeployClients(testClient, [nexusClient])
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  // test("should match account address", async () => {
  //   const accountAddress = await nexusSessionClient.account.getAddress()
  //   expect(accountAddress).toBe(dummyAddress)
  // })

  test("should install smartSessionValidator with no init data", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: {
        type: "validator",
        address: addresses.SmartSession
      }
    })

    if (!isInstalledBefore) {
      const hash = await nexusClient.installModule({
        module: {
          address: addresses.SmartSession,
          type: "validator"
        }
      })

      const { success: installSuccess } =
        await nexusClient.waitForUserOperationReceipt({ hash })
      expect(installSuccess).toBe(true)
    }

    const isInstalledAfter = await nexusClient.isModuleInstalled({
      module: {
        type: "validator",
        address: addresses.SmartSession
      }
    })
    expect(isInstalledAfter).toBe(true)
  })

  test("should create Counter increment session (USE mode) on installed smart session validator", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: {
        type: "validator",
        address: addresses.SmartSession
      }
    })

    expect(isInstalledBefore).toBe(true)

    // make EOA owner of SA session key as well
    const sessionKeyEOA = eoaAccount.address

    // Todo: Add a negative test case for time range policy
    const sessionRequestedInfo: CreateSessionDataParams = {
      sessionPublicKey: sessionKeyEOA,
      sessionValidatorAddress: TEST_CONTRACTS.SimpleSessionValidator.address,
      sessionKeyData: toHex(toBytes(sessionKeyEOA)),
      sessionValidAfter: 0,
      sessionValidUntil: 0,
      actionPoliciesInfo: [
        {
          contractAddress: TEST_CONTRACTS.Counter.address, // counter address
          functionSelector: "0x273ea3e3" as Hex, // function selector for increment count
          validUntil: 0, // 1717001666
          validAfter: 0,
          rules: [], // no other rules and conditions applied
          valueLimit: BigInt(0)
        }
      ]
    }

    const smartSessionNexusClient = nexusClient.extend(
      smartSessionValidatorActions()
    )

    const createSessionsResponse = await smartSessionNexusClient.createSessions(
      {
        account: nexusClient.account,
        sessionRequestedInfo: [sessionRequestedInfo]
      }
    )

    expect(createSessionsResponse.userOpHash).toBeDefined()
    expect(createSessionsResponse.permissionIds).toBeDefined()

    const permissionIds = createSessionsResponse.permissionIds
    expect(permissionIds.length).toBe(1)
    const permissionId = permissionIds[0]
    cachedPermissionId = permissionId

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: createSessionsResponse.userOpHash
    })

    expect(receipt.success).toBe(true)

    const isEnabled = await isSessionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: permissionId
    })
    expect(isEnabled).toBe(true)
  }, 60000)

  test("should make use of already enabled session (USE mode) to increment a counter using a session key", async () => {

    const nexusSessionClient = await createNexusSessionClient({
      chain,
      // account: nexusClient.account,
      accountAddress: nexusClient.account.address,
      client: testClient,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      sessionKeyEOA: eoaAccount.address,
      permissionId: cachedPermissionId,
      bundlerUrl,
    })

    const isEnabled = await isSessionEnabled({
      client: nexusSessionClient.account.client as PublicClient,
      accountAddress: nexusSessionClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)

    const pubClient = nexusSessionClient.account.client as PublicClient

    const counterBefore = await pubClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    const userOpHash = await useSession(nexusSessionClient, {
      account: nexusSessionClient.account,
      actions: [
        {
          target: TEST_CONTRACTS.Counter.address,
          value: 0n,
          callData: encodeFunctionData({
            abi: CounterAbi,
            functionName: "incrementNumber",
            args: []
          })
        }
      ],
      permissionId: cachedPermissionId
    })

    expect(userOpHash).toBeDefined()
    const receipt = await nexusSessionClient.waitForUserOperationReceipt({
      hash: userOpHash
    })
    expect(receipt.success).toBe(true)


    const counterAfter = await pubClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    expect(counterAfter).toBe(counterBefore + BigInt(1))
  }, 60000)
})
