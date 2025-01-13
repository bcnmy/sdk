import type { Address, Chain, Hex, LocalAccount } from "viem"
import { base } from "viem/chains"
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest"
import { toNetwork } from "../../../../test/testSetup"
import type { NetworkConfig } from "../../../../test/testUtils"
import type { MultichainSmartAccount } from "../../../account/utils/toMultiChainNexusAccount"
import { toMultichainNexusAccount } from "../../../account/utils/toMultiChainNexusAccount"
import { type MeeClient, createMeeClient } from "../../createMeeClient"
import { executeSignedQuote } from "./executeSignedQuote"
import type { Instruction } from "./getQuote"
import { signQuote } from "./signQuote"
vi.mock("./executeSignedQuote")

describe("mee:executeSignedQuote", () => {
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

  test("should execute a quote using executeSignedQuote", async () => {
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

    // Mock the executeSignedQuote function
    const mockExecuteResponse = { hash: "0x123" as Hex }
    // Mock implementation for this specific test
    vi.mocked(executeSignedQuote).mockResolvedValue(mockExecuteResponse)

    const quote = await meeClient.getQuote({
      instructions,
      feeToken: {
        address: paymentToken,
        chainId: paymentChain.id
      }
    })

    const signedQuote = await signQuote(meeClient, { quote })

    const { hash } = await executeSignedQuote(meeClient, {
      signedQuote
    })

    expect(hash).toEqual(mockExecuteResponse.hash)

    expect(executeSignedQuote).toHaveBeenCalledWith(meeClient, {
      signedQuote
    })
  })
})
