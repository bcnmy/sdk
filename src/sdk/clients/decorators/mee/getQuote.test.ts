import type { Address, Chain, LocalAccount, erc20Abi } from "viem"
import { base } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../../test/testSetup"
import type { NetworkConfig } from "../../../../test/testUtils"
import type { MultichainSmartAccount } from "../../../account/toMultiChainNexusAccount"
import { toMultichainNexusAccount } from "../../../account/toMultiChainNexusAccount"
import { mcUSDC } from "../../../constants/tokens"
import { type MeeClient, createMeeClient } from "../../createMeeClient"
import { type Instruction, getQuote } from "./getQuote"

describe("mee.getQuote", () => {
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

  test("should resolve instructions", async () => {
    const instructions: Instruction[] = [
      {
        calls: [
          {
            to: "0x0000000000000000000000000000000000000000",
            gasLimit: 50000n,
            value: 0n
          }
        ],
        chainId: 8453
      },
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

    expect(instructions).toBeDefined()
    expect(instructions.length).toEqual(2)

    const quote = await getQuote(meeClient, {
      instructions: instructions,
      feeToken: {
        address: paymentToken,
        chainId: paymentChain.id
      }
    })

    expect(quote).toBeDefined()
  })

  test("should resolve unresolved instructions", async () => {
    const quote = await getQuote(meeClient, {
      instructions: [
        mcNexus.build({
          type: "intent",
          data: {
            amount: BigInt(1000),
            mcToken: mcUSDC,
            chain: base
          }
        }),
        mcNexus.build({
          type: "base",
          data: {
            instructions: [
              {
                calls: [
                  {
                    to: "0x0000000000000000000000000000000000000000",
                    gasLimit: 50000n,
                    value: 0n
                  }
                ],
                chainId: base.id
              }
            ]
          }
        })
      ],
      feeToken: {
        address: paymentToken,
        chainId: paymentChain.id
      }
    })

    expect(quote.userOps.length).toEqual(3)
  })
})
