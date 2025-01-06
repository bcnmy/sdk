import {
  http,
  type Address,
  type Chain,
  type LocalAccount,
  type PublicClient,
  type WalletClient,
  createWalletClient
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../test/testUtils"
import {
  type NexusClient,
  createSmartAccountClient
} from "../clients/createSmartAccountClient"
import {
  RHINESTONE_ATTESTER_ADDRESS,
  TEST_ADDRESS_K1_VALIDATOR_ADDRESS,
  TEST_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
} from "../constants"
import type { NexusAccount } from "./toNexusAccount"
import { getCounterFactualAddress } from "./utils"

describe("nexus.account.addresses", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let userTwo: LocalAccount
  let nexusAccountAddress: Address
  let nexusClient: NexusClient
  let nexusAccount: NexusAccount
  let walletClient: WalletClient

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    userTwo = getTestAccount(1)
    testClient = toTestClient(chain, getTestAccount(5))

    walletClient = createWalletClient({
      account: eoaAccount,
      chain,
      transport: http()
    })

    nexusClient = await createSmartAccountClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      k1ValidatorAddress: TEST_ADDRESS_K1_VALIDATOR_ADDRESS,
      factoryAddress: TEST_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
    })

    nexusAccount = nexusClient.account
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should check account address", async () => {
    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    const counterfactualAddressFromHelper = await getCounterFactualAddress(
      testClient as unknown as PublicClient,
      eoaAccount.address,
      true,
      0n,
      [RHINESTONE_ATTESTER_ADDRESS],
      1,
      TEST_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
    )
    const gottenAddress = await nexusClient.account.getAddress()
    expect(counterfactualAddressFromHelper).toBe(nexusAccountAddress)
    expect(nexusAccount.address).toBe(nexusAccountAddress)
    expect(nexusAccount.address).toBe(counterfactualAddressFromHelper)
    expect(gottenAddress).toBe(nexusAccountAddress)
  })

  test("should check addresses after fund and deploy", async () => {
    await fundAndDeployClients(testClient, [nexusClient])
    const counterfactualAddressFromHelper = await getCounterFactualAddress(
      testClient as unknown as PublicClient,
      eoaAccount.address,
      true,
      0n,
      [RHINESTONE_ATTESTER_ADDRESS],
      1,
      TEST_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
    )
    const gottenAddress = await nexusClient.account.getAddress()
    expect(counterfactualAddressFromHelper).toBe(nexusAccountAddress)
    expect(nexusAccount.address).toBe(nexusAccountAddress)
    expect(nexusAccount.address).toBe(counterfactualAddressFromHelper)
    expect(gottenAddress).toBe(nexusAccountAddress)
  })

  test("should override account address", async () => {
    const someoneElsesNexusAddress =
      "0xf0479e036343bC66dc49dd374aFAF98402D0Ae5f"
    const newNexusClient = await createSmartAccountClient({
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      accountAddress: someoneElsesNexusAddress,
      signer: eoaAccount
    })
    const accountAddress = await newNexusClient.account.getAddress()
    const someoneElseCounterfactualAddress =
      await newNexusClient.account.getCounterFactualAddress()
    expect(newNexusClient.account.address).toBe(
      someoneElseCounterfactualAddress
    )
    expect(accountAddress).toBe(someoneElsesNexusAddress)
  })
})
