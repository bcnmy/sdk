import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
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
import { smartSessionCreateActions } from "../modules/validators/smartSessionValidator/decorators"
import { type NexusClient, createNexusClient } from "./createNexusClient"
import { createNexusSessionClient } from "./createNexusSessionClient"

describe("nexus.session.client", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: Account
  let sessionKeyAccount: Account
  let sessionPublicKey: Address
  let cachedPermissionId: Hex
  let nexusClient: NexusClient
  let nexusAccountAddress: Hex

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    sessionKeyAccount = getTestAccount(1)
    sessionPublicKey = sessionKeyAccount.address

    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })
    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
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
    const sessionRequestedInfo: CreateSessionDataParams[] = [
      {
        sessionPublicKey, // session key signer
        sessionValidatorAddress: TEST_CONTRACTS.SimpleSessionValidator.address,
        sessionKeyData: toHex(toBytes(sessionPublicKey)),
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
    ]

    const nexusSessionClient = nexusClient.extend(smartSessionCreateActions())

    const createSessionsResponse = await nexusSessionClient.createSessions({
      sessionRequestedInfo
    })

    expect(createSessionsResponse.userOpHash).toBeDefined()
    expect(createSessionsResponse.permissionIds).toBeDefined()
    ;[cachedPermissionId] = createSessionsResponse.permissionIds

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: createSessionsResponse.userOpHash
    })

    expect(receipt.success).toBe(true)

    const isEnabled = await isSessionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)
  }, 60000)

  test("session signer should use session to increment a counter for a user (USE MODE)", async () => {
    const dappSessionClient = await createNexusSessionClient({
      chain,
      accountAddress: nexusClient.account.address, // this will the the user's SA address
      signer: sessionKeyAccount, // session signer (unused)
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    const isEnabled = await isSessionEnabled({
      client: testClient as unknown as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)

    const counterBefore = await testClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    const userOpHash = await dappSessionClient.useSession({
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
      data: {
        permissionId: cachedPermissionId
      }
    })

    expect(userOpHash).toBeDefined()
    const receipt = await dappSessionClient.waitForUserOperationReceipt({
      hash: userOpHash
    })
    expect(receipt.success).toBe(true)

    const counterAfter = await testClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    expect(counterAfter).toBe(counterBefore + BigInt(1))
  }, 60000)

  test("session signer is not allowed to send unauthorised action", async () => {
    const dappSessionClient = await createNexusSessionClient({
      chain,
      accountAddress: nexusClient.account.address, // this will the the user's SA address
      signer: sessionKeyAccount, // session signer
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    const isEnabled = await isSessionEnabled({
      client: testClient as unknown as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)

    const counterBefore = await testClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber"
    })

    // @note this should fail as session signer is not allowed to send this action
    // @note session signer is only allowed to call incrementNumber

    expect(
      dappSessionClient.useSession({
        actions: [
          {
            target: TEST_CONTRACTS.Counter.address,
            value: 0n,
            callData: encodeFunctionData({
              abi: CounterAbi,
              functionName: "decrementNumber"
            })
          }
        ],
        data: {
          permissionId: cachedPermissionId
        }
      })
    ).rejects.toThrow()

    const counterAfter = await testClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    expect(counterAfter).toBe(counterBefore)
  }, 60000)
})
