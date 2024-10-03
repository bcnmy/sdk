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
import { toK1ValidatorModule } from "./toK1ValidatorModule"

describe("modules.k1Validator.write", async () => {
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

  test("k1Validator properties", async () => {
    const k1Validator = await toK1ValidatorModule({
      client: nexusClient.account.client as PublicClient,
      initData: encodePacked(["address"], [eoaAccount.address]),
      deInitData: "0x",
      accountAddress: nexusClient.account.address
    })
    expect(k1Validator.signMessage).toBeDefined()
    expect(k1Validator.signUserOpHash).toBeDefined()
    expect(k1Validator.getStubSignature).toBeDefined()
    expect(k1Validator.address).toBeDefined()
    expect(k1Validator.client).toBeDefined()
    expect(k1Validator.initData).toBeDefined()
    expect(k1Validator.deInitData).toBeDefined()
    expect(k1Validator.signer).toBeDefined()
    expect(k1Validator.type).toBeDefined()
  })

  test("should install k1 validator with 1 owner", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: {
        type: "validator",
        address: addresses.K1Validator,
        data: encodePacked(["address"], [eoaAccount.address])
      }
    })

    if (!isInstalledBefore) {
      const hash = await nexusClient.installModule({
        module: {
          address: addresses.K1Validator,
          type: "validator",
          data: encodePacked(["address"], [eoaAccount.address])
        }
      })

      const { success: installSuccess } =
        await nexusClient.waitForUserOperationReceipt({ hash })
      expect(installSuccess).toBe(true)

      const deInitData = encodePacked(["address"], [eoaAccount.address])

      const hashUninstall = nexusClient.uninstallModule({
        module: {
          address: addresses.K1Validator,
          type: "validator",
          data: deInitData
        }
      })

      expect(hashUninstall).rejects.toThrow()
    } else {
      const deInitData = encodePacked(["address"], [eoaAccount.address])

      const hashUninstall = nexusClient.uninstallModule({
        module: {
          address: addresses.K1Validator,
          type: "validator",
          data: deInitData
        }
      })

      expect(hashUninstall).rejects.toThrow()
    }
  })
})
