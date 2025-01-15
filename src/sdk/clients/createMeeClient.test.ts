import { type Address, type Chain, type LocalAccount, isHex } from "viem"
import { base } from "viem/chains"
import { beforeAll, describe, expect, inject, test } from "vitest"
import { toNetwork } from "../../test/testSetup"
import type { NetworkConfig } from "../../test/testUtils"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "../account/toMultiChainNexusAccount"
import { mcUSDC } from "../constants/tokens"
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
    // including 'buildInstructions'. They all are resolved in the 'getQuote' method under the hood.
    const currentInstructions = await meeClient.account.buildInstructions({
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

    const preparedInstructions = await meeClient.account.buildInstructions({
      currentInstructions,
      action: {
        type: "BRIDGE",
        parameters: {
          amount: BigInt(1000),
          mcToken: mcUSDC,
          chain: base
        }
      }
    })

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
    "should demo the devEx for getting a quote with preconfigured instructions, then signing and executing it",
    async () => {
      console.time("execute:hashTimer")
      // Start performance timing for tracking how long the transaction hash and receipt take
      console.time("execute:hashTimer")
      console.time("execute:receiptTimer")

      // Create an array of instructions that will be executed as a single transaction
      const instructions = [
        // First instruction: Bridge USDC tokens
        mcNexus.buildInstructions({
          action: {
            type: "BRIDGE",
            parameters: {
              amount: BigInt(1000), // Amount of tokens to bridge (in smallest unit, e.g., wei)
              mcToken: mcUSDC, // The multichain USDC token being bridged
              chain: base // Destination chain (Base network)
            }
          }
        }),
        // Second instruction: Execute a simple call on the Base network
        mcNexus.buildInstructions({
          action: {
            type: "DEFAULT",
            parameters: [
              {
                calls: [
                  {
                    to: "0x0000000000000000000000000000000000000000", // Target contract (zero address in this test)
                    gasLimit: 50000n, // Maximum gas allowed for this call
                    value: 0n // No ETH being sent with the call
                  }
                ],
                chainId: base.id // Execute this call on the Base network
              }
            ]
          }
        })
      ]

      // Get a quote for executing all instructions
      // This will calculate the total cost in the specified payment token
      const quote = await meeClient.getQuote({
        instructions,
        feeToken: {
          address: paymentToken, // Token used to pay for the transaction
          chainId: paymentChain.id // Chain where the payment will be processed
        }
      })

      // Execute the quote and get back a transaction hash
      // This sends the transaction to the network
      const { hash } = await meeClient.executeQuote({ quote })
      expect(hash).toBeDefined()
      console.timeEnd("execute:hashTimer")
      const receipt = await meeClient.waitForSupertransactionReceipt({ hash })
      console.timeEnd("execute:receiptTimer")
      expect(receipt).toBeDefined()
      console.log(receipt.explorerLinks)
    }
  )
})
