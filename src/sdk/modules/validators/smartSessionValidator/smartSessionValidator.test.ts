import {
    http,
    type Account,
    type Address,
    type Chain,
    type PublicClient,
    encodePacked,
    toBytes,
    toHex,
    Hex
  } from "viem"
  import { afterAll, beforeAll, describe, expect, test } from "vitest"
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
  import { toSmartSessionValidatorModule } from "./tosmartSessionValidatorModule"
import { CreateSessionDataParams } from "../../utils/Types"
import { TEST_CONTRACTS } from "../../../../test/callDatas"
import { isSessionEnabled } from "./decorators/Helper"
import { smartSessionValidatorActions } from "./decorators"
  
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
        nexusAccountAddress: nexusClient.account.address
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
          address: addresses.SmartSession,
        }
      })
  
      if (!isInstalledBefore) {
        const hash = await nexusClient.installModule({
          module: {
            address: addresses.SmartSession,
            type: "validator",
          }
        })
  
        const { success: installSuccess } =
          await nexusClient.waitForUserOperationReceipt({ hash })
        expect(installSuccess).toBe(true)
      }
      
      const isInstalledAfter = await nexusClient.isModuleInstalled({
        module: {
          type: "validator",
          address: addresses.SmartSession,
        }
      })
      expect(isInstalledAfter).toBe(true)
    })

    test("should get stub signature from smartSessionValidator with USE mode", async () => {
      const smartSessionValidator = await toSmartSessionValidatorModule({
        client: nexusClient.account.client as PublicClient,
        initData: encodePacked(["address"], [eoaAccount.address]),
        deInitData: "0x",
        nexusAccountAddress: nexusClient.account.address
      })

      const stubSig = await smartSessionValidator.getStubSignature({permissionId: "0xfcb2f4375207e6abcd89f2cd06c962435405acde8a974d872b373d7c5d557f0a"})
      expect(stubSig).toBeDefined()
    })

    test("should get actual signature from smartSessionValidator with USE mode", async () => {
      const smartSessionValidator = await toSmartSessionValidatorModule({
        client: nexusClient.account.client as PublicClient,
        initData: encodePacked(["address"], [eoaAccount.address]),
        deInitData: "0x",
        nexusAccountAddress: nexusClient.account.address
      })

      const mockUserOpHash = "0x1234567890123456789012345678901234567890123456789012345678901234"
      const stubSig = await smartSessionValidator.signUserOpHash(mockUserOpHash, {permissionId: "0xfcb2f4375207e6abcd89f2cd06c962435405acde8a974d872b373d7c5d557f0a"})
      expect(stubSig).toBeDefined()
    })

    test("should create Counter increment session (USE mode) on installed smart session validator", async () => {
      const isInstalledBefore = await nexusClient.isModuleInstalled({
        module: {
          type: "validator",
          address: addresses.SmartSession,
        }
      })
  
      expect(isInstalledBefore).toBe(true)
  
      const smartSessionValidator = await toSmartSessionValidatorModule({
        client: nexusClient.account.client as PublicClient,
        initData: encodePacked(["address"], [eoaAccount.address]),
        deInitData: "0x",
        nexusAccountAddress: nexusClient.account.address
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
        actionPoliciesInfo: 
        [{
        contractAddress: TEST_CONTRACTS.Counter.address, // counter address
        functionSelector: "0x273ea3e3" as Hex, // function selector for increment count
        validUntil: 0, // 1717001666
        validAfter: 0,
        rules: [], // no other rules and conditions applied
        valueLimit: BigInt(0) 
        }],
      }

      const smartSessionNexusClient = nexusClient.extend(smartSessionValidatorActions())

      // Review: if this looks good
      const enableSessionsResponse = await smartSessionNexusClient.enableSessions({
        account: nexusClient.account,
        sessionRequestedInfo: [sessionRequestedInfo]
      })

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
  })