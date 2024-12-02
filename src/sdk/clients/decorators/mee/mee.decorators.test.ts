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
import { toNetworks } from "../../../../test/testSetup"
import type { NetworkConfig } from "../../../../test/testUtils"
import {
  type NexusAccount,
  toNexusAccount
} from "../../../account/toNexusAccount"
import {
  MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS,
  MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
} from "../../../constants"
import { type MeeClient, createMeeClient } from "../../createMeeClient"

describe("mee.decorators", async () => {
  let networkOne: NetworkConfig
  let networkTwo: NetworkConfig

  let chainOne: Chain
  let chainTwo: Chain

  let eoaAccount: Account
  let recipientAddress: Address
  let nexusAccountOne: NexusAccount
  let nexusAccountTwo: NexusAccount
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

    meeClient = await createMeeClient({
      accounts: [nexusAccountOne, nexusAccountTwo]
    })
  })

  test("should call prepareUserOperation ", async () => {
    await expect(
      meeClient.prepareSuperTransaction({ testParam: 1 })
    ).rejects.toThrow("Not Found, 404")
  })
})
