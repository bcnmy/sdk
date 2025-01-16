import type { Address, Chain, LocalAccount } from "viem"
import { base } from "viem/chains"
import { beforeAll, describe, expect, it } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import type { NetworkConfig } from "../../../test/testUtils"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../../account/toMultiChainNexusAccount"
import { type MeeClient, createMeeClient } from "../../clients/createMeeClient"
import { mcUSDC } from "../../constants/tokens"
import { getUnifiedERC20Balance } from "./getUnifiedERC20Balance"

describe("mee:getUnifiedERC20Balance", () => {
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

  it("should aggregate balances across chains correctly", async () => {
    const unifiedBalance = await getUnifiedERC20Balance({
      account: mcNexus,
      mcToken: mcUSDC
    })

    expect(unifiedBalance.balance).toBeGreaterThan(0n)
    expect(unifiedBalance.breakdown).toHaveLength(2)
    expect(unifiedBalance.decimals).toBe(6)

    expect(unifiedBalance.breakdown[0]).toHaveProperty("balance")
    expect(unifiedBalance.breakdown[0]).toHaveProperty("decimals")
    expect(unifiedBalance.breakdown[0]).toHaveProperty("chainId")
  })
})
