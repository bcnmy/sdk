import { type Address, type Chain, type LocalAccount, isHex } from "viem"
import { base } from "viem/chains"
import { beforeAll, describe, expect, inject, test } from "vitest"
import { toNetwork } from "../../test/testSetup"
import type { NetworkConfig } from "../../test/testUtils"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../account/toMultiChainNexusAccount"
import { type MeeClient, createMeeClient } from "./createMeeClient"
import type { Instruction } from "./decorators/mee"

// @ts-ignore
const { runPaidTests } = inject("settings")

describe("mee.createMeeClient", async () => {
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

  test("should get a quote", async () => {
    const meeClient = createMeeClient({ account: mcNexus })

    const quote = await meeClient.getQuote({
      instructions: [],
      feeToken: {
        address: paymentToken,
        chainId: paymentChain.id
      }
    })

    expect(quote).toBeDefined()
    expect(quote.paymentInfo.sender).toEqual(
      mcNexus.deploymentOn(paymentChain.id)?.address
    )
    expect(quote.paymentInfo.token).toEqual(paymentToken)
    expect(+quote.paymentInfo.chainId).toEqual(paymentChain.id)
  })

  test("should sign a quote", async () => {
    const quote = await meeClient.getQuote({
      instructions: [
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
      ],
      feeToken: {
        address: paymentToken,
        chainId: paymentChain.id
      }
    })

    const signedQuote = await meeClient.signQuote({ quote })

    expect(signedQuote).toBeDefined()
    expect(isHex(signedQuote.signature)).toEqual(true)
  })

  test
    .runIf(runPaidTests)
    .skip("should execute a quote by getting it, signing it, and then executing the signed quote", async () => {
      const quote = await meeClient.getQuote({
        instructions: [
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
        ],
        feeToken: {
          address: paymentToken,
          chainId: paymentChain.id
        }
      })

      const signedQuote = await meeClient.signQuote({ quote })
      const executeeQuote = await meeClient.executeSignedQuote({ signedQuote })

      expect(executeeQuote).toBeDefined()
      expect(executeeQuote.hash).toBeDefined()
      expect(isHex(executeeQuote.hash)).toEqual(true)
    })

  test("should demo the devEx of preparing instructions", async () => {
    // These can be any 'Instruction', or any helper method that resolves to a 'Instruction',
    // including 'buildBalanceInstruction'. They all are resolved in the 'getQuote' method under the hood.
    const preparedInstructions: Instruction[] = [
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

    expect(preparedInstructions).toBeDefined()

    const quote = await meeClient.getQuote({
      instructions: preparedInstructions,
      feeToken: {
        address: paymentToken,
        chainId: paymentChain.id
      }
    })

    expect(quote.userOps.length).toEqual(3)
    expect(quote).toBeDefined()
    expect(quote.paymentInfo.sender).toEqual(
      mcNexus.deploymentOn(paymentChain.id)?.address
    )
    expect(quote.paymentInfo.token).toEqual(paymentToken)
    expect(+quote.paymentInfo.chainId).toEqual(paymentChain.id)
  })

  test.runIf(runPaidTests)(
    "should execute a quote with a single call, and wait for the receipt",
    async () => {
      console.time("execute:hashTimer")
      console.time("execute:receiptTimer")
      const { hash } = await meeClient.execute({
        instructions: [
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
        ],
        feeToken: {
          address: paymentToken,
          chainId: paymentChain.id
        }
      })

      expect(hash).toBeDefined()
      console.timeEnd("execute:hashTimer")
      const receipt = await meeClient.waitForSupertransactionReceipt({ hash })
      console.timeEnd("execute:receiptTimer")
      expect(receipt).toBeDefined()
      console.log(receipt.explorerLinks)
    }
  )
})
