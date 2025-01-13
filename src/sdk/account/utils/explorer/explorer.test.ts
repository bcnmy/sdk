import type { Address, Chain, LocalAccount } from "viem"
import { base, baseSepolia } from "viem/chains"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../../test/testSetup"
import type { NetworkConfig } from "../../../../test/testUtils"
import {
  type MeeClient,
  createMeeClient
} from "../../../clients/createMeeClient"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../toMultiChainNexusAccount"
import { getExplorerTxLink, getJiffyScanLink, getMeeScanLink } from "./explorer"

describe("explorer", () => {
  let network: NetworkConfig
  let eoaAccount: LocalAccount
  let paymentChain: Chain
  let paymentToken: Address
  let mcNexusMainnet: MultichainSmartAccount
  let meeClient: MeeClient

  beforeAll(async () => {
    network = await toNetwork("MAINNET_FROM_ENV_VARS")

    paymentChain = network.chain
    paymentToken = network.paymentToken!
    eoaAccount = network.account!

    mcNexusMainnet = await toMultichainNexusAccount({
      chains: [base, paymentChain],
      signer: eoaAccount
    })

    meeClient = createMeeClient({ account: mcNexusMainnet })
  })

  test("should get a meescan url", () => {
    const hash = "0x123"
    const url = getMeeScanLink(hash)
    expect(url).toEqual(`https://meescan.biconomy.io/details/${hash}`)
  })

  test("should get a jiffyscan url", () => {
    const hash = "0x123"
    const url = getJiffyScanLink(hash)
    expect(url).toEqual(`https://v2.jiffyscan.xyz/tx/${hash}`)
  })

  test("should get a url for a baseSepolia tx", () => {
    const hash = "0x123"
    const url = getExplorerTxLink(hash, baseSepolia)
    expect(url).toEqual(`${baseSepolia.blockExplorers?.default.url}/tx/${hash}`)
  })
  test("should get a url for a baseSepolia tx by chainId (number)", () => {
    const hash = "0x123"
    const url = getExplorerTxLink(hash, baseSepolia.id)
    expect(url).toEqual(`${baseSepolia.blockExplorers?.default.url}/tx/${hash}`)
  })
  test("should get a url for a baseSepolia tx by chainId (string)", () => {
    const hash = "0x123"
    const url = getExplorerTxLink(hash, String(baseSepolia.id))
    expect(url).toEqual(`${baseSepolia.blockExplorers?.default.url}/tx/${hash}`)
  })
})
