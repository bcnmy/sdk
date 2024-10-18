import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  encodePacked
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import {
  fundAndDeployClients,
  getBalance,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../../test/testUtils"
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import { K1_VALIDATOR_ADDRESS } from "../../constants"
import { toK1Validator } from "./toK1Validator"

describe("modules.k1Validator", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: Account
  let nexusClient: NexusClient
  let recipient: Account
  let recipientAddress: Address
  let nexusAccountAddress: Hex

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

  test("should send eth", async () => {
    const balanceBefore = await getBalance(testClient, recipientAddress)
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        }
      ],
      // Note
      // supplying key = 0 will pass it on
      // supplying key = 123n will pass it on
      // supplying no key and just getNonce will make it a timestamp
      // Note: ignore ts error below.
      nonce: await nexusClient.account.getNonce({ key: 123n })

      // Note: one can directly supply fixed or just use below for 2D nonce
      // nonce: await nexusClient.account.getNonce()
    })
    const { status } = await nexusClient.waitForTransactionReceipt({ hash })
    expect(status).toBe("success")
    const balanceAfter = await getBalance(testClient, recipientAddress)
    expect(balanceAfter - balanceBefore).toBe(1n)
  }, 90000)

  test("k1Validator properties", async () => {
    const k1Validator = toK1Validator({
      signer: nexusClient.account.signer,
      accountAddress: nexusClient.account.address
    })
    expect(k1Validator.signMessage).toBeDefined()
    expect(k1Validator.signUserOpHash).toBeDefined()
    expect(k1Validator.address).toBeDefined()
    expect(k1Validator.initData).toBeDefined()
    expect(k1Validator.deInitData).toBeDefined()
    expect(k1Validator.signer).toBeDefined()
    expect(k1Validator.type).toBeDefined()
  })

  test("should install k1 validator with 1 owner", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: {
        type: "validator",
        module: K1_VALIDATOR_ADDRESS,
        initData: encodePacked(["address"], [eoaAccount.address])
      }
    })

    if (!isInstalledBefore) {
      const hash = await nexusClient.installModule({
        module: {
          module: K1_VALIDATOR_ADDRESS,
          type: "validator",
          initData: encodePacked(["address"], [eoaAccount.address])
        }
      })

      const { success: installSuccess } =
        await nexusClient.waitForUserOperationReceipt({ hash })
      expect(installSuccess).toBe(true)

      const deInitData = encodePacked(["address"], [eoaAccount.address])

      const hashUninstall = nexusClient.uninstallModule({
        module: {
          module: K1_VALIDATOR_ADDRESS,
          type: "validator",
          deInitData
        }
      })

      expect(hashUninstall).rejects.toThrow()
    } else {
      const deInitData = encodePacked(["address"], [eoaAccount.address])

      const hashUninstall = nexusClient.uninstallModule({
        module: {
          module: K1_VALIDATOR_ADDRESS,
          type: "validator",
          deInitData
        }
      })

      expect(hashUninstall).rejects.toThrow()
    }
  })
})
