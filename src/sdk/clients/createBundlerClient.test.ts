import { http, type Address, type Hex, createPublicClient } from "viem"
import { createBundlerClient } from "viem/account-abstraction"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import { type NexusAccount, toNexusAccount } from "../account/toNexusAccount"
import { safeMultiplier } from "../account/utils"
import { MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS } from "../constants"
import { MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS } from "../constants"
import type { NexusClient } from "./createNexusClient"
import { erc7579Actions } from "./decorators/erc7579"
import { smartAccountActions } from "./decorators/smartAccount"

const COMPETITORS = [
  {
    name: "Pimlico",
    bundlerUrl: `https://api.pimlico.io/v2/${process.env.CHAIN_ID}/rpc?apikey=${process.env.PIMLICO_API_KEY}`
  }
]

describe.each(COMPETITORS)(
  "nexus.interoperability with $name",
  async ({ bundlerUrl }) => {
    const chain = baseSepolia
    const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY as Hex}`)

    const publicClient = createPublicClient({
      chain,
      transport: http()
    })
    const recipientAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth
    let nexusAccountAddress: Address
    let nexusAccount: NexusAccount
    let bundlerClient: NexusClient

    beforeAll(async () => {
      nexusAccount = await toNexusAccount({
        signer: account,
        chain,
        transport: http(),
        // You can omit this outside of a testing context
        k1ValidatorAddress: MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS,
        factoryAddress: MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
      })

      nexusAccountAddress = await nexusAccount.getCounterFactualAddress()

      bundlerClient = createBundlerClient({
        chain,
        transport: http(bundlerUrl),
        account: nexusAccount,
        // Different vendors have different fee estimation strategies
        userOperation: {
          estimateFeesPerGas: async (_) => {
            const feeData = await publicClient.estimateFeesPerGas()
            return {
              maxFeePerGas: safeMultiplier(feeData.maxFeePerGas, 1.6),
              maxPriorityFeePerGas: safeMultiplier(
                feeData.maxPriorityFeePerGas,
                1.6
              )
            }
          }
        }
      })
        .extend(erc7579Actions())
        .extend(smartAccountActions()) as unknown as NexusClient
    })

    test("should have standard bundler methods", () => {
      expect(bundlerClient).toHaveProperty("sendUserOperation")
      expect(bundlerClient.sendUserOperation).toBeInstanceOf(Function)
      expect(bundlerClient).toHaveProperty("estimateUserOperationGas")
      expect(bundlerClient.estimateUserOperationGas).toBeInstanceOf(Function)
      expect(bundlerClient).toHaveProperty("getUserOperationReceipt")
      expect(bundlerClient.getUserOperationReceipt).toBeInstanceOf(Function)
    })

    test("should send a transaction through bundler", async () => {
      // Get initial balance
      const initialBalance = await publicClient.getBalance({
        address: nexusAccountAddress
      })

      // Send user operation
      const hash = await bundlerClient.sendTransaction({
        calls: [
          {
            to: recipientAddress,
            value: 1n
          }
        ]
      })

      // Wait for the transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      expect(receipt.status).toBe("success")

      // Get final balance
      const finalBalance = await publicClient.getBalance({
        address: nexusAccountAddress
      })

      // Check that the balance has decreased by more than 1n (value sent)
      // because gas fees were paid
      expect(finalBalance).toBeLessThan(initialBalance - 1n)
    })
  }
)
