import type { Address, Chain, Hex, LocalAccount } from "viem"
import { base } from "viem/chains"
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest"
import { toNetwork } from "../../../../test/testSetup"
import type { NetworkConfig } from "../../../../test/testUtils"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../../../account/toMultiChainNexusAccount"
import { type MeeClient, createMeeClient } from "../../createMeeClient"
import { execute } from "./execute"
import type { Instruction } from "./getQuote"

vi.mock("./execute")

describe("mee.execute", () => {
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

  test("should execute a quote using execute", async () => {
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

    // Mock the execute function
    const mockExecuteResponse = { hash: "0x123" as Hex }
    // Mock implementation for this specific test
    vi.mocked(execute).mockResolvedValue(mockExecuteResponse)

    const { hash } = await execute(meeClient, {
      instructions: instructions,
      feeToken: {
        address: paymentToken,
        chainId: paymentChain.id
      }
    })

    expect(hash).toEqual(mockExecuteResponse.hash)

    expect(execute).toHaveBeenCalledWith(meeClient, {
      instructions: instructions,
      feeToken: {
        address: paymentToken,
        chainId: paymentChain.id
      }
    })
  })
})
