import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  encodePacked,
  toBytes,
  toHex
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
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
import { CounterAbi } from "../../../__contracts/abi/CounterAbi"
import addresses from "../../../__contracts/addresses"
import {
  type NexusClient,
  createNexusClient
} from "../../../clients/createNexusClient"
import type { CreateSessionDataParams } from "../../utils/Types"
import { smartSessionValidatorActions } from "./decorators"
import { isSessionEnabled } from "./decorators/Helper"
import { toSmartSessionValidatorModule } from "./tosmartSessionValidatorModule"

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

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    recipient = getTestAccount(1)
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

  test.skip("should send eth", async () => {
    const balanceBefore = await getBalance(testClient, recipientAddress)
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        }
      ]
    })
    const { success } = await nexusClient.waitForUserOperationReceipt({ hash })
    const balanceAfter = await getBalance(testClient, recipientAddress)
    expect(success).toBe(true)
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

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

    // TODO: marked for deletion if we do not use any getters
    const smartSessionValidator = await toSmartSessionValidatorModule({
      client: nexusClient.account.client as PublicClient,
      initData: encodePacked(["address"], [eoaAccount.address]),
      deInitData: "0x",
      nexusAccountAddress: nexusClient.account.address,
      activePermissionId: "0x"
    })

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

    // Review: if this looks good
    const enableSessionsResponse = await smartSessionNexusClient.enableSessions(
      {
        account: nexusClient.account,
        sessionRequestedInfo: [sessionRequestedInfo]
      }
    )

    expect(enableSessionsResponse.userOpHash).toBeDefined()
    expect(enableSessionsResponse.permissionIds).toBeDefined()

    const permissionIds = enableSessionsResponse.permissionIds
    expect(permissionIds.length).toBe(1)
    const permissionId = permissionIds[0]
    cachedPermissionId = permissionId

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: enableSessionsResponse.userOpHash
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
    const isEnabled = await isSessionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)

    console.log({ cachedPermissionId })

    // TODO: marked for deletion if we do not use any getters
    const smartSessionValidator = await toSmartSessionValidatorModule({
      client: nexusClient.account.client as PublicClient,
      initData: encodePacked(["address"], [eoaAccount.address]),
      deInitData: "0x",
      nexusAccountAddress: nexusClient.account.address,
      activePermissionId: cachedPermissionId
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

    // TODO: dev notes below: marked for deletion
    // Note: this is possible and maybe pass to prepareUserOperation if that path is probable.
    // const stubSig = await smartSessionValidator.getStubSignature({permissionId: cachedPermissionId})

    // Note: this is possible and maybe pass to sendTransaction/sendUseroperation a final signature. It would need userOpHash built prior, using prepareUseroperation?
    // const stubSig = await smartSessionValidator.signUserOpHash(mockUserOpHash, {permissionId: cachedPermissionId})

    // Note: possibly can not be used. unless useEnabledSession decorator works
    // ^ (that would in turn either need activePermisisonId to set or perhaps sending overridden sig to sendUserOperation)
    // const smartSessionNexusClient = nexusClient.extend(smartSessionValidatorActions())

    // Note: POC
    // smartSessionValidator.activePermissionId = cachedPermissionId
    smartSessionValidator.activePermissionId = cachedPermissionId

    // set active validation module
    nexusClient.account.setActiveValidationModule(smartSessionValidator)

    // Make userop to increase counter
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        }
      ]
    })

    const { status } = await testClient.waitForTransactionReceipt({ hash })
    expect(status).toBe("success")

    const counterAfter = await pubClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    expect(counterAfter).toBe(counterBefore + BigInt(1))
  }, 60000)
})
