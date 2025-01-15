import type { Address, Chain, LocalAccount } from "viem"
import { base } from "viem/chains"
import { beforeAll, describe, expect, it } from "vitest"
import { toNetwork } from "../../../../test/testSetup"
import type { NetworkConfig } from "../../../../test/testUtils"
import {
  type MeeClient,
  createMeeClient
} from "../../../clients/createMeeClient"
import type { Instruction } from "../../../clients/decorators/mee/getQuote"
import { mcUSDC } from "../../../constants/tokens"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../../toMultiChainNexusAccount"
import buildIntent from "./buildIntent"

describe("mee:buildIntent", () => {
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
    const instructions: Instruction[] = await buildIntent(
      { account: mcNexus },
      {
        amount: 100n,
        mcToken: mcUSDC,
        chain: base
      }
    )

    expect(instructions).toHaveLength(1)
    expect(instructions[0].calls).toHaveLength(2)
  })
})
