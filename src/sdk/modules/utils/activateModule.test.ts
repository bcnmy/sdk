import { OWNABLE_VALIDATOR_ADDRESS } from "@rhinestone/module-sdk/module"
import { http, type Account, type Address, type Chain, isHex } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../test/testUtils"
import addresses from "../../__contracts/addresses"
import type { NexusAccount } from "../../account/toNexusAccount"
import { ERROR_MESSAGES } from "../../account/utils/Constants"
import { addressEquals } from "../../account/utils/Utils"
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import { ownableActions } from "../ownables/decorators"
import { activateModule } from "./activateModule"

describe("modules.activateModule", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: Account
  let nexusClient: NexusClient
  let nexusAccount: NexusAccount
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

    nexusAccount = nexusClient.account

    nexusAccountAddress = await nexusAccount.getCounterFactualAddress()
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test.concurrent("should have an active module", async () => {
    const activeModule = nexusAccount.getModule()
    expect(isHex(activeModule?.address)).toBe(true)
  })

  test.concurrent("should activate ownables module", async () => {
    const activeModule = nexusAccount.getModule()
    const activeModuleAddress = activeModule?.address

    activateModule("ownable", nexusAccount)
    const newActiveModule = nexusAccount.getModule()
    const newActiveModuleAddress = newActiveModule?.address

    expect(isHex(newActiveModuleAddress)).toBe(true)
    expect(newActiveModuleAddress).toBe(OWNABLE_VALIDATOR_ADDRESS)
    expect(addressEquals(activeModuleAddress, newActiveModuleAddress)).toBe(
      false
    )
  })

  test.concurrent("should activate k1 module", async () => {
    activateModule("k1", nexusAccount)
    const newActiveModule = nexusAccount.getModule()
    const newActiveModuleAddress = newActiveModule?.address
    expect(isHex(newActiveModuleAddress)).toBe(true)
    expect(newActiveModuleAddress).toBe(addresses.K1Validator)
  })

  test.concurrent(
    "should have a permissionId if smart session module is activated",
    async () => {
      const activeModule = nexusAccount.getModule()
      const activeModuleAddress = activeModule?.address

      expect(() => activateModule("useSession", nexusAccount)).toThrow(
        ERROR_MESSAGES.SMART_SESSION_DATA_REQUIRED
      )
    }
  )

  test.concurrent.skip("should activate ownables under the hood", async () => {
    const activeModule = nexusAccount.getModule()
    const activeModuleAddress = activeModule?.address

    nexusClient.extend(ownableActions())

    const newActiveModule = nexusAccount.getModule()
    const newActiveModuleAddress = newActiveModule?.address

    expect(addressEquals(activeModuleAddress, newActiveModuleAddress)).toBe(
      false
    )
    expect(newActiveModuleAddress).toBe(OWNABLE_VALIDATOR_ADDRESS)
  })
})
