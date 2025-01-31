import type { Address, Chain, LocalAccount } from "viem"
import { base } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../test/testSetup"
import type { NetworkConfig } from "../../test/testUtils"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../account/toMultiChainNexusAccount"
import createHttpClient from "./createHttpClient"
import { type MeeClient, createMeeClient } from "./createMeeClient"

describe("mee.createHttpClient", async () => {
  let network: NetworkConfig
  let eoaAccount: LocalAccount
  let paymentChain: Chain
  let paymentToken: Address
  let mcNexus: MultichainSmartAccount
  let meeClient: MeeClient

  beforeAll(async () => {
    network = await toNetwork("MAINNET_FROM_ENV_VARS")

    paymentChain = network.chain
    paymentToken = network.paymentToken!
    eoaAccount = network.account!

    mcNexus = await toMultichainNexusAccount({
      chains: [base, paymentChain],
      signer: eoaAccount
    })

    meeClient = createMeeClient({ account: mcNexus })
  })

  test("should instantiate a client", async () => {
    const httpClient = createHttpClient("http://google.com")

    expect(httpClient).toBeDefined()
    expect(httpClient.request).toBeDefined()
    expect(Object.keys(httpClient)).toContain("request")
    expect(Object.keys(httpClient)).not.toContain("account")
    expect(Object.keys(httpClient)).not.toContain("getQuote")
  })
})
