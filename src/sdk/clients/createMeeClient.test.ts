import {
  http,
  type Account,
  type Address,
  type Chain,
  type PrivateKeyAccount,
  type PublicClient,
  createPublicClient
} from "viem"
import { beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../test/testSetup"
import type { NetworkConfig } from "../../test/testUtils"
import { type NexusAccount, addressEquals } from "../account"
import { toNexusAccount } from "../account/toNexusAccount"
import { MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS } from "../constants"
import { MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS } from "../constants"
import { createMeeClient } from "./createMeeClient"
import type { MeeClient } from "./createMeeClient"

describe("mee.client", async () => {
  let networkOne: NetworkConfig
  let networkTwo: NetworkConfig

  let chainOne: Chain
  let chainTwo: Chain

  let eoaAccount: Account
  let recipientAddress: Address
  let nexusAccountOne: NexusAccount
  let nexusAccountTwo: NexusAccount
  let nexusAccountAddressOne: Address
  let nexusAccountAddressTwo: Address
  let publicClientOne: PublicClient
  let publicClientTwo: PublicClient

  let meeClient: MeeClient

  beforeAll(async () => {
    ;[networkOne, networkTwo] = await toNetworks([
      "TESTNET_FROM_ENV_VARS",
      "TESTNET_FROM_ALT_ENV_VARS"
    ])

    chainOne = networkOne.chain
    chainTwo = networkTwo.chain

    eoaAccount = networkOne.account as PrivateKeyAccount

    recipientAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth

    publicClientOne = createPublicClient({
      chain: chainOne,
      transport: http()
    })

    publicClientTwo = createPublicClient({
      chain: chainTwo,
      transport: http()
    })

    nexusAccountOne = await toNexusAccount({
      transport: http(),
      chain: chainOne,
      signer: eoaAccount,
      k1ValidatorAddress: MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS,
      factoryAddress: MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
    })
    nexusAccountTwo = await toNexusAccount({
      transport: http(),
      chain: chainTwo,
      signer: eoaAccount,
      k1ValidatorAddress: MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS,
      factoryAddress: MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
    })

    meeClient = createMeeClient({
      accounts: [nexusAccountOne, nexusAccountTwo]
    })
  })

  test("should get chainIds from publicClients", async () => {
    const chainIds = await Promise.all(
      [publicClientOne, publicClientTwo].map((client) => client.getChainId())
    )
    expect(chainIds).to.equal([chainOne.id, chainTwo.id])
  })

  test("should have matching addresses on different chains", async () => {
    nexusAccountAddressOne = await nexusAccountOne.getAddress()
    nexusAccountAddressTwo = await nexusAccountTwo.getAddress()
    expect(addressEquals(nexusAccountAddressOne, nexusAccountAddressTwo))
  })
})
