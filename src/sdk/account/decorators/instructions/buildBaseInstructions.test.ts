import type { Address, Chain, LocalAccount } from "viem"
import { base } from "viem/chains"
import { beforeAll, describe, expect, it } from "vitest"
import { toNetwork } from "../../../../test/testSetup"
import type { NetworkConfig } from "../../../../test/testUtils"
import {
  type MeeClient,
  createMeeClient
} from "../../../clients/createMeeClient"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../../toMultiChainNexusAccount"
import buildBaseInstructions from "./buildBaseInstructions"

describe("mee:buildBaseInstructions", () => {
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
    const instructions = await buildBaseInstructions(
      {
        account: mcNexus
      },
      {
        instructions: [
          {
            chainId: base.id,
            calls: [
              {
                to: "0x0000000000000000000000000000000000000000",
                gasLimit: 50000n,
                value: 0n
              }
            ]
          }
        ]
      }
    )

    expect(instructions.length).toBeGreaterThan(0)
  })
})
