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
import { buildBalanceInstructions } from "./buildBalanceInstructions"

describe("mee:buildBalanceInstruction", () => {
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

  it("should adjust the account balance", async () => {
    const instructions = await buildBalanceInstructions({
      account: mcNexus,
      amount: BigInt(1000),
      token: mcUSDC,
      chain: base
    })

    expect(instructions.length).toBeGreaterThan(0)
    expect(instructions[0]).toHaveProperty("calls")
    expect(instructions[0].calls.length).toBeGreaterThan(0)
  })
})
