import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  type PublicClient,
  encodeFunctionData,
  toBytes,
  toHex
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../../test/__contracts/abi/CounterAbi"
import { TEST_CONTRACTS } from "../../../../test/callDatas"
import { toNetwork } from "../../../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../../../test/testUtils"
import addresses from "../../../__contracts/addresses"
import {
  type NexusClient,
  createNexusClient
} from "../../../clients/createNexusClient"
import { createNexusSessionClient } from "../../../clients/createNexusSessionClient"
import { isSessionEnabled } from "./Helper"
import type { CreateSessionDataParams } from "./Types"
import { smartSessionCreateActions } from "./decorators"
import { toUseSessionModule } from "./toUseSessionModule"

describe("smart.sessions.write", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let nexusClient: NexusClient
  let cachedPermissionId: Hex
  let nexusAccountAddress: Hex
  let sessionKeyAccount: Account
  let sessionPublicKey: Address

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

  test("should have valid smartSessionValidator properties", async () => {
    const smartSessionValidator = toUseSessionModule({
      account: nexusClient.account,
      signer: eoaAccount,
      data: {
        permissionId:
          "0xfcb2f4375207e6abcd89f2cd06c962435405acde8a974d872b373d7c5d557f0a"
      }
    })
    expect(smartSessionValidator.signMessage).toBeDefined()
    expect(smartSessionValidator.signUserOpHash).toBeDefined()
    expect(smartSessionValidator.address).toBeDefined()
    expect(smartSessionValidator.initData).toBeDefined()
    expect(smartSessionValidator.deInitData).toBeDefined()
    expect(smartSessionValidator.signer).toBeDefined()
    expect(smartSessionValidator.type).toBeDefined()
  })

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

  test("should get stub signature from smartSessionValidator with USE mode", async () => {
    const smartSessionValidator = toUseSessionModule({
      account: nexusClient.account,
      signer: eoaAccount,
      data: {
        permissionId:
          "0xfcb2f4375207e6abcd89f2cd06c962435405acde8a974d872b373d7c5d557f0a"
      }
    })

    const stubSig = await smartSessionValidator.getStubSignature()
    expect(stubSig).toBeDefined()
  })

  test("should get actual signature from smartSessionValidator with USE mode", async () => {
    const smartSessionValidator = toUseSessionModule({
      account: nexusClient.account,
      signer: eoaAccount,
      data: {
        permissionId:
          "0xfcb2f4375207e6abcd89f2cd06c962435405acde8a974d872b373d7c5d557f0a"
      }
    })

    const mockUserOpHash =
      "0x1234567890123456789012345678901234567890123456789012345678901234"
    const realSig = await smartSessionValidator.signUserOpHash(mockUserOpHash)
    expect(realSig).toBeDefined()
  })

  test("should create Counter increment session (USE mode) on installed smart session validator", async () => {
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
  }, 60000)

  test("should make use of already enabled session (USE mode) to increment a counter using a session key", async () => {
    const counterBefore = await testClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber"
    })

    const dappNexusClient = await createNexusSessionClient({
      chain,
      accountAddress: nexusClient.account.address,
      signer: sessionKeyAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    const userOpHash = await dappNexusClient.useSession({
      actions: [
        {
          target: TEST_CONTRACTS.Counter.address,
          value: 0n,
          callData: encodeFunctionData({
            abi: CounterAbi,
            functionName: "incrementNumber"
          })
        }
      ],
      data: {
        permissionId: cachedPermissionId
      }
    })

    expect(userOpHash).toBeDefined()
    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })
    expect(receipt.success).toBe(true)

    const counterAfter = await testClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber"
    })

    expect(counterAfter).toBe(counterBefore + BigInt(1))
  }, 60000)
})
