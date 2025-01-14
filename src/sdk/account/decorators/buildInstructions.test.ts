import type { Address, Chain, LocalAccount } from "viem"
import { base } from "viem/chains"
import { beforeAll, describe, expect, it } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import type { NetworkConfig } from "../../../test/testUtils"
import { type MeeClient, createMeeClient } from "../../clients/createMeeClient"
import {
  Instruction,
  SupertransactionLike
} from "../../clients/decorators/mee/getQuote"
import { mcUSDC } from "../../constants/tokens"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../toMultiChainNexusAccount"
import { buildInstructions } from "./buildInstructions"

describe("mee:buildInstructions", () => {
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

  it("should use the default action while building instructions", async () => {
    const instructions = await buildInstructions({
      account: mcNexus,
      action: {
        type: "DEFAULT",
        parameters: [
          {
            calls: [
              {
                to: "0x0000000000000000000000000000000000000000",
                gasLimit: 50000n,
                value: 0n
              }
            ],
            chainId: 8453
          }
        ]
      }
    })

    expect(instructions).toMatchInlineSnapshot(`
      [
        {
          "calls": [
            {
              "gasLimit": 50000n,
              "to": "0x0000000000000000000000000000000000000000",
              "value": 0n,
            },
          ],
          "chainId": 8453,
        },
      ]
    `)
    expect(instructions.length).toBeGreaterThan(0)
  })

  it("should use the bridge action while building instructions", async () => {
    const initialInstructions = await buildInstructions({
      account: mcNexus,
      action: {
        type: "BRIDGE",
        parameters: {
          amount: BigInt(1000),
          mcToken: mcUSDC,
          chain: base
        }
      }
    })

    const instructions = await buildInstructions({
      currentInstructions: initialInstructions,
      account: mcNexus,
      action: {
        type: "DEFAULT",
        parameters: [
          {
            calls: [
              {
                to: "0x0000000000000000000000000000000000000000",
                gasLimit: 50000n,
                value: 0n
              }
            ],
            chainId: 8453
          }
        ]
      }
    })

    expect(instructions.length).toBe(2)
    expect(instructions[0].calls.length).toBe(2) // Bridge instructions generates two calls
    expect(instructions[1].calls.length).toBe(1) // Default instruction in this case generates one call
  })
})
