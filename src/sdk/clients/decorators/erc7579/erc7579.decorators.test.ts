import { textSpanOverlapsWith } from "typescript"
import {
  http,
  type Account,
  type Address,
  type Chain,
  encodeAbiParameters,
  encodePacked,
  isHex
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import mockAddresses from "../../../../test/__contracts/mockAddresses"
import { toNetwork } from "../../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../../test/testUtils"
import contracts from "../../../__contracts"
import { toNexusAccount } from "../../../account"
import { type NexusClient, createNexusClient } from "../../createNexusClient"

describe("erc7579.decorators", async () => {
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

    const nexusAccount = await toNexusAccount({
      client: testClient
    })

    nexusClient = await createNexusClient({
      account: nexusAccount,
      bundlerTransport: http(bundlerUrl)
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await fundAndDeployClients(testClient, [nexusClient])
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test.concurrent("should test read methods", async () => {
    const [
      installedValidators,
      installedExecutors,
      activeHook,
      fallbackSelector,
      supportsValidator,
      supportsDelegateCall,
      isK1ValidatorInstalled
    ] = await Promise.all([
      nexusClient.getInstalledValidators(),
      nexusClient.getInstalledExecutors(),
      nexusClient.getActiveHook(),
      nexusClient.getFallbackBySelector({ selector: "0xcb5baf0f" }),
      nexusClient.supportsModule({ type: "validator" }),
      nexusClient.supportsExecutionMode({ type: "delegatecall" }),
      nexusClient.isModuleInstalled({
        module: {
          type: "validator",
          module: contracts.k1Validator.address,
          initData: "0x"
        }
      })
    ])

    expect(installedExecutors[0].length).toBeTypeOf("number")
    expect(installedValidators[0]).toEqual([contracts.k1Validator.address])
    expect(isHex(activeHook)).toBe(true)
    expect(fallbackSelector.length).toBeTypeOf("number")
    expect(supportsValidator).toBe(true)
    expect(supportsDelegateCall).toBe(true)
    expect(isK1ValidatorInstalled).toBe(true)
  })

  test("should install a module", async () => {
    const hash = await nexusClient.installModule({
      module: {
        type: "validator",
        module: mockAddresses.MockValidator,
        initData: encodePacked(["address"], [eoaAccount.address])
      }
    })

    const { success } = await nexusClient.waitForUserOperationReceipt({ hash })
    expect(success).toBe(true)
  })

  test("should uninstall a module", async () => {
    const hash = await nexusClient.uninstallModule({
      module: {
        type: "validator",
        module: mockAddresses.MockValidator,
        initData: encodePacked(["address"], [eoaAccount.address])
      }
    })

    const { success } = await nexusClient.waitForUserOperationReceipt({ hash })
    expect(success).toBe(true)
  })
})
