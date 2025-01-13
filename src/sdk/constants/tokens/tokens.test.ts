import type { Address, Chain, LocalAccount } from "viem"
import { base, optimism } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"

import * as tokens from "."
import { toNetwork } from "../../../test/testSetup"
import type { NetworkConfig } from "../../../test/testUtils"
import { addressEquals } from "../../account/utils/Utils"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../../account/utils/toMultiChainNexusAccount"

describe("mee:tokens", async () => {
  let network: NetworkConfig
  let eoaAccount: LocalAccount
  let paymentChain: Chain
  let paymentToken: Address
  let mcNexusMainnet: MultichainSmartAccount

  beforeAll(async () => {
    network = await toNetwork("MAINNET_FROM_ENV_VARS")

    paymentChain = network.chain
    paymentToken = network.paymentToken!
    eoaAccount = network.account!

    mcNexusMainnet = await toMultichainNexusAccount({
      chains: [base, paymentChain],
      signer: eoaAccount
    })
  })

  test("should have relevant properties", async () => {
    for (const token of Object.values(tokens)) {
      expect(token).toHaveProperty("addressOn")
      expect(token).toHaveProperty("deployments")
      expect(token).toHaveProperty("on")
      expect(token).toHaveProperty("read")
    }
  })

  test("should instantiate a client", async () => {
    const token = tokens.mcUSDC
    const tokenWithChain = token.addressOn(10)
    const mcNexusAddress = mcNexusMainnet.deploymentOn(base.id).address

    const balances = await token.read({
      onChains: [base, optimism],
      functionName: "balanceOf",
      args: [mcNexusAddress],
      account: mcNexusMainnet
    })

    expect(balances.length).toBe(2)

    expect(
      addressEquals(
        tokenWithChain,
        "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"
      )
    ).toBe(true)
  })
})
