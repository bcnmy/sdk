import { type Address, type Chain, type LocalAccount, isHex } from "viem"
import { base } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../../test/testSetup"
import type { NetworkConfig } from "../../../../test/testUtils"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../../../account/utils/toMultiChainNexusAccount"
import { type MeeClient, createMeeClient } from "../../createMeeClient"
import type { Instruction } from "./getQuote"
import { signQuote } from "./signQuote"

describe("mee:signQuote", () => {
  let network: NetworkConfig
  let eoaAccount: LocalAccount
  let paymentChain: Chain
  let paymentToken: Address
  let mcNexusMainnet: MultichainSmartAccount
  let meeClient: MeeClient

  beforeAll(async () => {
    network = await toNetwork("MAINNET_FROM_ENV_VARS")

    paymentChain = network.chain
    paymentToken = network.paymentToken!
    eoaAccount = network.account!

    mcNexusMainnet = await toMultichainNexusAccount({
      chains: [base, paymentChain],
      signer: eoaAccount
    })

    meeClient = createMeeClient({ account: mcNexusMainnet })
  })

  test("should sign a quote", async () => {
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
      }
    ]

    expect(instructions).toBeDefined()

    const quote = await meeClient.getQuote({
      instructions: instructions,
      feeToken: {
        address: paymentToken,
        chainId: paymentChain.id
      }
    })

    const signedQuote = await signQuote(meeClient, { quote })

    expect(signedQuote).toBeDefined()
    expect(signedQuote.signature).toBeDefined()
    expect(isHex(signedQuote.signature)).toEqual(true)
  })
})
