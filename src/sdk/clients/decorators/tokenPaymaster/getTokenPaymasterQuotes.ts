import type { Account, Address, Chain, Client, Transport } from "viem"
import type { UserOperation } from "viem/account-abstraction"
import type { AnyData } from "../../../modules"

export type BicoTokenPaymasterRpcSchema = [
  {
    Method: "pm_getFeeQuoteOrData"
    Parameters: [TokenPaymasterUserOpParams, TokenPaymasterConfigParams]
    ReturnType: TokenPaymasterQuotesResponse
  }
]

type PaymasterMode = "ERC20"

export type FeeQuote = {
  symbol: string
  decimal: number
  tokenAddress: Address
  maxGasFee: number
  maxGasFeeUSD: number
  exchangeRate: number
  logoUrl: string
  premiumPercentage: string
  validUntil: number
}

export type TokenPaymasterQuotesResponse = {
  mode: PaymasterMode
  paymasterAddress: Address
  feeQuotes: FeeQuote[]
  unsupportedTokens: AnyData[]
}

export type TokenPaymasterUserOpParams = {
  sender: Address
  nonce: string
  factory: Address | undefined
  factoryData: `0x${string}` | undefined
  callData: `0x${string}`
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  verificationGasLimit: string
  callGasLimit: string
  preVerificationGas: string
  paymasterPostOpGasLimit: string
  paymasterVerificationGasLimit: string
}

export type TokenPaymasterConfigParams = {
  mode: PaymasterMode
  sponsorshipInfo: {
    smartAccountInfo: {
      name: string
      version: string
    }
  }
  tokenInfo: {
    tokenList: Address[]
  }
  expiryDuration: number
  calculateGasLimits: boolean
}

export type GetTokenPaymasterQuotesParameters = {
  userOp: UserOperation
  tokenList: Address[]
}

/**
 * Fetches paymaster quotes for ERC20 token payment options for a given UserOperation.
 *
 * @param userOp - The UserOperation to get paymaster quotes for
 * @param client - Viem Client configured with BicoTokenPaymaster RPC methods
 * @param tokenList - Array of ERC20 token addresses to get quotes for
 *
 * @returns A promise of {@link TokenPaymasterQuotesResponse}
 *
 * @example
 * ```typescript
 * // Configure client with paymaster RPC
 * const paymasterClient = createBicoPaymasterClient({
 *     paymasterUrl
 * })
 *
 * // Token addresses to get quotes for
 * const tokenList = [
 *   "0x...", // USDT
 *   "0x..."  // USDC
 * ];
 *
 * // Get paymaster quotes
 * const quotes = await paymasterClient.getTokenPaymasterQuotes(userOp, tokenList);
 *
 * // Example response:
 * // {
 * //   mode: "ERC20",
 * //   paymasterAddress: "0x...",
 * //   feeQuotes: [{
 * //     symbol: "USDT",
 * //     decimal: 6,
 * //     tokenAddress: "0x...",
 * //     maxGasFee: 5000000,
 * //     maxGasFeeUSD: 5,
 * //     exchangeRate: 1,
 * //     logoUrl: "https://...",
 * //     premiumPercentage: "0.1",
 * //     validUntil: 1234567890
 * //   }],
 * //   unsupportedTokens: []
 * // }
 * ```
 */
export const getTokenPaymasterQuotes = async (
  client: Client<
    Transport,
    Chain | undefined,
    Account | undefined,
    BicoTokenPaymasterRpcSchema
  >,
  parameters: GetTokenPaymasterQuotesParameters
): Promise<TokenPaymasterQuotesResponse> => {
  const { userOp, tokenList } = parameters
  const quote = await client.request({
    method: "pm_getFeeQuoteOrData",
    params: [
      {
        sender: userOp.sender,
        nonce: userOp.nonce.toString(),
        factory: userOp.factory,
        factoryData: userOp.factoryData,
        callData: userOp.callData,
        maxFeePerGas: userOp.maxFeePerGas.toString(),
        maxPriorityFeePerGas: userOp.maxPriorityFeePerGas.toString(),
        verificationGasLimit: BigInt(userOp.verificationGasLimit).toString(),
        callGasLimit: BigInt(userOp.callGasLimit).toString(),
        preVerificationGas: BigInt(userOp.preVerificationGas).toString(),
        paymasterPostOpGasLimit:
          userOp.paymasterPostOpGasLimit?.toString() ?? "0",
        paymasterVerificationGasLimit:
          userOp.paymasterVerificationGasLimit?.toString() ?? "0"
      },
      {
        mode: "ERC20",
        sponsorshipInfo: {
          smartAccountInfo: {
            name: "BICONOMY",
            version: "2.0.0"
          }
        },
        tokenInfo: {
          tokenList
        },
        expiryDuration: 6000,
        calculateGasLimits: true
      }
    ]
  })

  return quote
}
