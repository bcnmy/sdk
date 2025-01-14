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
import { AcrossPlugin } from "../utils/acrossPlugin"
import type { MultichainAddressMapping } from "./buildBridgeInstructions"
import { queryBridge } from "./queryBridge"

describe("mee:queryBridge", () => {
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

  it("should query the bridge", async () => {
    const unifiedBalance = await mcNexus.getUnifiedERC20Balance(mcUSDC)

    const tokenMapping: MultichainAddressMapping = {
      on: (chainId: number) =>
        unifiedBalance.token.deployments.get(chainId) || "0x",
      deployments: Array.from(
        unifiedBalance.token.deployments.entries(),
        ([chainId, address]) => ({ chainId, address })
      )
    }

    const payload = await queryBridge({
      account: mcNexus,
      amount: 18600927n,
      toChain: base,
      fromChain: paymentChain,
      tokenMapping
    })

    expect(payload?.amount).toBeGreaterThan(0n)
    expect(payload?.receivedAtDestination).toBeGreaterThan(0n)
    expect(payload?.plugin).toBe(AcrossPlugin)
  })
})
