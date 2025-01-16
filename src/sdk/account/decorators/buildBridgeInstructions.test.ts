import type { Address, Chain, LocalAccount } from "viem"
import { base } from "viem/chains"
import { beforeAll, describe, expect, it } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import type { NetworkConfig } from "../../../test/testUtils"
import { type MeeClient, createMeeClient } from "../../clients/createMeeClient"
import { mcUSDC } from "../../constants/tokens"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../toMultiChainNexusAccount"
import { toAcrossPlugin } from "../utils/toAcrossPlugin"
import buildBridgeInstructions from "./buildBridgeInstructions"
import { getUnifiedERC20Balance } from "./getUnifiedERC20Balance"

describe("mee:buildBridgeInstructions", () => {
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

  it("should call the bridge with a unified balance", async () => {
    const unifiedBalance = await mcNexus.getUnifiedERC20Balance(mcUSDC)
    const payload = await buildBridgeInstructions({
      account: mcNexus,
      amount: 1n,
      bridgingPlugins: [toAcrossPlugin()],
      toChain: base,
      unifiedBalance
    })

    expect(payload).toHaveProperty("meta")
    expect(payload).toHaveProperty("instructions")
    expect(payload.instructions.length).toBeGreaterThan(0)
    expect(payload.meta.bridgingInstructions.length).toBeGreaterThan(0)
    expect(payload.meta.bridgingInstructions[0]).toHaveProperty("userOp")
    expect(payload.meta.bridgingInstructions[0].userOp).toHaveProperty("calls")
    expect(
      payload.meta.bridgingInstructions[0].userOp.calls.length
    ).toBeGreaterThan(0)
  })
})
