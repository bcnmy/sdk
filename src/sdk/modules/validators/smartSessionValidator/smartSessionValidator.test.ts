import {
    http,
    type Account,
    type Address,
    type Chain,
    type PublicClient,
    encodePacked
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
  import { toSmartSessionValidatorModule } from "./toSmartSessionValidatorModule"
  
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
  })