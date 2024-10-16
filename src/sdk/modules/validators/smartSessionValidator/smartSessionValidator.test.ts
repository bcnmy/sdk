import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  encodeFunctionData,
  encodePacked,
  toBytes,
  toHex
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../../test/__contracts/abi/CounterAbi"
import { TEST_CONTRACTS } from "../../../../test/callDatas"
import { toNetwork } from "../../../../test/testSetup"
import {
  fundAndDeployClients,
  getBalance,
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
import { isPermissionEnabled } from "./Helper"
import type { CreateSessionDataParams } from "./Types"
import { smartSessionValidatorActions } from "./decorators"
import { useSession } from "./decorators/useSession"
import { toSmartSessionValidatorModule } from "./tosmartSessionValidatorModule"
import { MockRegistryAbi } from "../../../../test/__contracts/abi"
import { MockAttesterAbi } from "../../../../test/__contracts/abi/MockAttesterAbi"

describe("modules.smartSessionValidator.write", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: Account
  let nexusClient: NexusClient
  let nexusAccountAddress: Address
  let recipient: Account
  let recipientAddress: Address
  let cachedPermissionId: Hex
  let sessionAccount: Account // Session key signer
  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    recipient = getTestAccount(1)
    sessionAccount = getTestAccount(2)
    recipientAddress = recipient.address

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

  test("should send eth, register and attest modules, and trust mock attester", async () => {
    const balanceBefore = await getBalance(testClient, recipientAddress)
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        },
        /*{
          to: TEST_CONTRACTS.MockRegistry.address,
          value: 0n,
          data: encodeFunctionData({
            abi: MockRegistryAbi,
            functionName: "registerModule",
            args: ["0xdbca873b13c783c0c9c6ddfc4280e505580bf6cc3dac83f8a0f7b44acaafca4f", TEST_CONTRACTS.SmartSession.address, "0x", "0x"]
          })
        },
        {
          to: TEST_CONTRACTS.MockRegistry.address,
          value: 0n,
          data: encodeFunctionData({
            abi: MockRegistryAbi,
            functionName: "registerModule",
            args: ["0xdbca873b13c783c0c9c6ddfc4280e505580bf6cc3dac83f8a0f7b44acaafca4f", TEST_CONTRACTS.UniActionPolicy.address, "0x", "0x"]
          })
        },
        {
          to: TEST_CONTRACTS.MockRegistry.address,
          value: 0n,
          data: encodeFunctionData({
            abi: MockRegistryAbi,
            functionName: "registerModule",
            args: ["0xdbca873b13c783c0c9c6ddfc4280e505580bf6cc3dac83f8a0f7b44acaafca4f", TEST_CONTRACTS.TimeFramePolicy.address, "0x", "0x"]
          })
        },
        {
          to: TEST_CONTRACTS.MockAttester.address,
          value: 0n,
          data: encodeFunctionData({
            abi: MockAttesterAbi,
            functionName: "attest",
            args: [TEST_CONTRACTS.MockRegistry.address, "0x93d46fcca4ef7d66a413c7bde08bb1ff14bacbd04c4069bb24cd7c21729d7bf1", [TEST_CONTRACTS.SmartSession.address, 0, "0x", [BigInt(1)]]]
          })
        },
        {
          to: TEST_CONTRACTS.MockAttester.address,
          value: 0n,
          data: encodeFunctionData({
            abi: MockAttesterAbi,
            functionName: "attest",
            args: [TEST_CONTRACTS.MockRegistry.address, "0x93d46fcca4ef7d66a413c7bde08bb1ff14bacbd04c4069bb24cd7c21729d7bf1", [TEST_CONTRACTS.UniActionPolicy.address, 0, "0x", [BigInt(5)]]]
          })
        },
        {
          to: TEST_CONTRACTS.MockAttester.address,
          value: 0n,
          data: encodeFunctionData({
            abi: MockAttesterAbi,
            functionName: "attest",
            args: [TEST_CONTRACTS.MockRegistry.address, "0x93d46fcca4ef7d66a413c7bde08bb1ff14bacbd04c4069bb24cd7c21729d7bf1", [TEST_CONTRACTS.TimeFramePolicy.address, 0, "0x", [BigInt(5)]]]
          })
        },*/
        {
          to: TEST_CONTRACTS.MockRegistry.address,
          value: 0n,
          data: encodeFunctionData({
            abi: MockRegistryAbi,
            functionName: "trustAttesters",
            args: [1, [TEST_CONTRACTS.MockAttester.address]] // Review if more attesters needed
          })
        }
      ]
    })
    const { status } = await testClient.waitForTransactionReceipt({ hash })
    expect(status).toBe("success")
    const balanceAfter = await getBalance(testClient, recipientAddress)
    expect(balanceAfter - balanceBefore).toBe(1n)
  }, 200000)

  test("smartSessionValidator properties", async () => {
    const smartSessionValidator = await toSmartSessionValidatorModule({
      client: nexusClient.account.client as PublicClient,
      initData: encodePacked(["address"], [eoaAccount.address]),
      deInitData: "0x",
      nexusAccountAddress: nexusClient.account.address,
      activePermissionId: "0x"
    })
    expect(smartSessionValidator.signMessage).toBeDefined()
    expect(smartSessionValidator.signUserOpHash).toBeDefined()
    expect(smartSessionValidator.getStubSignature).toBeDefined()
    expect(smartSessionValidator.address).toBeDefined()
    expect(smartSessionValidator.client).toBeDefined()
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
    const smartSessionValidator = await toSmartSessionValidatorModule({
      client: nexusClient.account.client as PublicClient,
      initData: encodePacked(["address"], [eoaAccount.address]),
      deInitData: "0x",
      nexusAccountAddress: nexusClient.account.address,
      activePermissionId: "0x"
    })

    const stubSig = await smartSessionValidator.getStubSignature({
      permissionId:
        "0xfcb2f4375207e6abcd89f2cd06c962435405acde8a974d872b373d7c5d557f0a"
    })
    expect(stubSig).toBeDefined()
  })

  test("should get actual signature from smartSessionValidator with USE mode", async () => {
    const smartSessionValidator = await toSmartSessionValidatorModule({
      client: nexusClient.account.client as PublicClient,
      initData: encodePacked(["address"], [eoaAccount.address]),
      deInitData: "0x",
      nexusAccountAddress: nexusClient.account.address,
      activePermissionId: "0x"
    })

    const mockUserOpHash =
      "0x1234567890123456789012345678901234567890123456789012345678901234"
    const realSig = await smartSessionValidator.signUserOpHash(mockUserOpHash, {
      permissionId:
        "0xfcb2f4375207e6abcd89f2cd06c962435405acde8a974d872b373d7c5d557f0a"
    })
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

    // make EOA owner of SA session key as well
    const sessionKeyEOA = sessionAccount.address

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

    const isEnabled = await isPermissionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: permissionId
    })
    expect(isEnabled).toBe(true)
  }, 60000)

  test("should make use of already enabled session (USE mode) to increment a counter using a session key", async () => {
    const isEnabled = await isPermissionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)

    const nexusSessionClient = await createNexusSessionClient({
      chain,
      accountAddress: nexusClient.account.address,
      signer: sessionAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      permissionId: cachedPermissionId,
      bundlerUrl
    })

    const pubClient = nexusClient.account.client as PublicClient

    const counterBefore = await pubClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    // helpful for out of range test
    // await testClient.setNextBlockTimestamp({
    //   timestamp: 9727001666n
    // })

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
    const receipt = await nexusClient.waitForUserOperationReceipt({
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
