import type { Address } from "viem"
import type { PaymasterClient, UserOperation } from "viem/account-abstraction"
import {
  FeeQuote,
  type TokenPaymasterQuotesResponse,
  getTokenPaymasterQuotes
} from "./getTokenPaymasterQuotes"
import { NexusClient } from "../../createNexusClient"
import { getSupportedTokens } from "./getSupportedTokens"

export type TokenPaymasterActions = {
  /**
   * Fetches paymaster quotes for ERC20 token payment options for a given UserOperation.
   *
   * @param userOp - The UserOperation to get paymaster quotes for
   * @param client - Viem Client configured with BicoTokenPaymaster RPC methods
   * @param tokenList - Array of ERC20 token addresses to get quotes for
   *
   * @returns Promise containing paymaster quotes response with fee details for each supported token
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
  getTokenPaymasterQuotes: (
    userOp: UserOperation,
    tokenList: Address[]
  ) => Promise<TokenPaymasterQuotesResponse>,
  getSupportedTokens: (
    client: NexusClient
  ) => Promise<FeeQuote[]>
}

export const bicoTokenPaymasterActions =
  () =>
    (client: PaymasterClient): TokenPaymasterActions => ({
      /**
       * Fetches paymaster quotes for ERC20 token payment options for a given UserOperation.
       *
       * @param userOp - The UserOperation to get paymaster quotes for
       * @param client - Viem Client configured with BicoTokenPaymaster RPC methods
       * @param tokenList - Array of ERC20 token addresses to get quotes for
       *
       * @returns Promise containing paymaster quotes response with fee details for each supported token
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
      getTokenPaymasterQuotes: async (
        userOp: UserOperation,
        tokenList: Address[]
      ) => getTokenPaymasterQuotes(userOp, client, tokenList),
      getSupportedTokens: async (client: NexusClient) => getSupportedTokens(client)
    })

