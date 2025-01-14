import {
  http,
  type Address,
  type Chain,
  type LocalAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import type { NetworkConfig } from "../../../test/testUtils"
import {
  MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS,
  NEXUS_ACCOUNT_FACTORY
} from "../../constants"
import { getK1NexusAddress, getMeeNexusAddress } from "./getNexusAddress"

describe("account.getNexusAddress", () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let publicClient: PublicClient
  let eoaAccount: LocalAccount

  beforeAll(async () => {
    network = await toNetwork("TESTNET_FROM_ENV_VARS")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = network.account!
    publicClient = createPublicClient({
      chain,
      transport: http(network.rpcUrl)
    })
  })

  test("should check k1 nexus address", async () => {
    const customAttesters = [
      "0x1111111111111111111111111111111111111111" as Address,
      "0x2222222222222222222222222222222222222222" as Address
    ]
    const customThreshold = 2
    const customIndex = 5n

    const k1AddressWithParams = await getK1NexusAddress({
      publicClient: publicClient as unknown as PublicClient,
      signerAddress: eoaAccount.address,
      attesters: customAttesters,
      threshold: customThreshold,
      index: customIndex
    })

    expect(k1AddressWithParams).toMatchInlineSnapshot(
      `"0x93828A8f4405F112a65bf1732a4BE8f5B4C99322"`
    )
  })

  test("should check mee nexus address", async () => {
    const index = 1n

    const meeAddress = await getMeeNexusAddress({
      publicClient: publicClient as unknown as PublicClient,
      signerAddress: eoaAccount.address
    })

    expect(meeAddress).toMatchInlineSnapshot(
      `"0x1968a6Ab4a542EB22e7452AC25381AE6c0f07826"`
    )
  })
})
