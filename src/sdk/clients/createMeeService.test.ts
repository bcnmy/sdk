import {
  http,
  type Address,
  type Chain,
  type LocalAccount,
  type PrivateKeyAccount,
  type PublicClient,
  createPublicClient
} from "viem"
import { beforeAll, describe, expect, test } from "vitest"
import { toNetworks } from "../../test/testSetup"
import type { NetworkConfig } from "../../test/testUtils"
import { toNexusAccount } from "../account/toNexusAccount"
import { MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS } from "../constants"
import { MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS } from "../constants"
import { type MeeService, createMeeService } from "./createMeeService"

describe("mee.agent", async () => {
  let networkOne: NetworkConfig
  let networkTwo: NetworkConfig

  let chainOne: Chain
  let chainTwo: Chain

  let eoaAccount: LocalAccount
  let recipientAddress: Address
  let publicClientOne: PublicClient
  let publicClientTwo: PublicClient

  let meeService: MeeService

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

    meeService = await createMeeService({
      accountParams: {
        signer: eoaAccount,
        k1ValidatorAddress: MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS,
        factoryAddress: MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS,
        chainList: [
          {
            transport: http(),
            chain: chainOne
          },
          {
            transport: http(),
            chain: chainTwo
          }
        ]
      }
    })
  })

  test("should get chainIds from publicClients", async () => {
    const chainIds = await Promise.all(
      [publicClientOne, publicClientTwo].map((client) => client.getChainId())
    )
    expect(chainIds).to.deep.equal([chainOne.id, chainTwo.id])
  })

  test("should have relevant meeService properties", async () => {
    expect(meeService).toHaveProperty("accounts")
    expect(typeof meeService.getFeeQuote).toBe("function")
  })

  test("should alternatively create a mee client from two distinct nexus accounts", async () => {
    const nexusAccountOne = await toNexusAccount({
      transport: http(),
      chain: chainOne,
      signer: eoaAccount,
      k1ValidatorAddress: MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS,
      factoryAddress: MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
    })
    const nexusAccountTwo = await toNexusAccount({
      transport: http(),
      chain: chainTwo,
      signer: eoaAccount,
      k1ValidatorAddress: MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS,
      factoryAddress: MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
    })

    const meeService = await createMeeService({
      accounts: [nexusAccountOne, nexusAccountTwo]
    })

    expect(meeService).toHaveProperty("accounts")
  })
})
