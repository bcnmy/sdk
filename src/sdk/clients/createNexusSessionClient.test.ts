import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  createWalletClient,
  toBytes,
  toHex
} from "viem"
import type { PublicClient } from "viem"
import { encodeFunctionData } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../test/__contracts/abi"
import { TEST_CONTRACTS } from "../../test/callDatas"
import { toNetwork } from "../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../test/testUtils"
import addresses from "../__contracts/addresses"
import { isSessionEnabled } from "../modules/validators/smartSessionValidator/Helper"
import type { CreateSessionDataParams } from "../modules/validators/smartSessionValidator/Types"
import { createSessions } from "../modules/validators/smartSessionValidator/decorators"
import { useSession } from "../modules/validators/smartSessionValidator/decorators/useSession"
import { type NexusClient, createNexusClient } from "./createNexusClient"
import { createNexusSessionClient } from "./createNexusSessionClient"

describe("nexus.client", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: Account
  let sessionAccount: Account
  let sessionAccountAddress: Address
  let cachedPermissionId: Hex
  let nexusClient: NexusClient

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    sessionAccount = getTestAccount(1)
    sessionAccountAddress = sessionAccount.address

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
      bundlerTransport: http(bundlerUrl)
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

  test("should create a session to increment a counter (USE MODE)", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: {
        type: "validator",
        address: addresses.SmartSession
      }
    })

    expect(isInstalledBefore).toBe(true)

    // session key signer address is declared here
    const sessionKeyEOA = sessionAccountAddress

    const sessionRequestedInfo: CreateSessionDataParams = {
      sessionPublicKey: sessionKeyEOA, // session key signer
      sessionValidatorAddress: TEST_CONTRACTS.SimpleSessionValidator.address,
      sessionKeyData: toHex(toBytes(sessionKeyEOA)),
      sessionValidAfter: 0,
      sessionValidUntil: 0,
      actionPoliciesInfo: [
        {
          contractAddress: TEST_CONTRACTS.Counter.address, // counter address
          functionSelector: "0x273ea3e3" as Hex, // function selector for increment count
          validUntil: 0,
          validAfter: 0,
          rules: [], // no other rules and conditions applied
          valueLimit: BigInt(0)
        }
      ]
    }

    const createSessionsResponse = await createSessions(nexusClient, {
      account: nexusClient.account,
      sessionRequestedInfo: [sessionRequestedInfo]
    })

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

  test("session signer should use session to increment a counter for a user (USE MODE)", async () => {
    const nexusSessionClient = await createNexusSessionClient({
      chain,
      // account: nexusClient.account,
      accountAddress: nexusClient.account.address, // this will the the user's SA address
      signer: sessionAccount, // session signer
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      permissionId: cachedPermissionId, // permissionId of the session generated by user
      bundlerUrl
    })

    const isEnabled = await isSessionEnabled({
      client: nexusSessionClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
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

  test("session signer is not allowed to send unauthorised action", async () => {
    const nexusSessionClient = await createNexusSessionClient({
      chain,
      accountAddress: nexusClient.account.address, // this will the the user's SA address
      signer: sessionAccount, // session signer
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      permissionId: cachedPermissionId, // permissionId of the session generated by user
      bundlerUrl
    })

    const isEnabled = await isSessionEnabled({
      client: nexusSessionClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
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

    // @note this should fail as session signer is not allowed to send this action
    // @note session signer is only allowed to call incrementNumber
    const result = useSession(nexusSessionClient, {
      account: nexusSessionClient.account,
      actions: [
        {
          target: TEST_CONTRACTS.Counter.address,
          value: 0n,
          callData: encodeFunctionData({
            abi: CounterAbi,
            functionName: "decrementNumber",
            args: []
          })
        }
      ],
      permissionId: cachedPermissionId
    })

    expect(result).rejects.toThrow()

    const counterAfter = await pubClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    expect(counterAfter).toBe(counterBefore)
  }, 60000)
})
