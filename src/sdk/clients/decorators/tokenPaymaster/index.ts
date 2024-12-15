import type { Address } from "viem"
import type { PaymasterClient, UserOperation } from "viem/account-abstraction"
import type { NexusClient } from "../../createNexusClient"
import { getSupportedTokens } from "./getSupportedTokens"
import {
  type FeeQuote,
  type TokenPaymasterQuotesResponse,
  getTokenPaymasterQuotes
} from "./getTokenPaymasterQuotes"

export type TokenPaymasterActions = {
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
  getTokenPaymasterQuotes: (
    userOp: UserOperation,
    tokenList: Address[]
  ) => Promise<TokenPaymasterQuotesResponse>
  /**
   * Retrieves the supported tokens for the Biconomy Token Paymaster..
   *
   * @param client - The Nexus client instance
   * @returns A promise that resolves to an array of FeeQuote objects.
   *
   * @example
   * ```typescript
   * const supportedTokens = await paymaster.getSupportedTokens(nexusClient);
   * console.log(supportedTokens);
   * ```
   */
  getSupportedTokens: (client: NexusClient) => Promise<FeeQuote[]>
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
    getTokenPaymasterQuotes: async (
      userOp: UserOperation,
      tokenList: Address[]
    ) => getTokenPaymasterQuotes(userOp, client, tokenList),
    /**
     * Retrieves the supported tokens for the Biconomy Token Paymaster..
     *
     * @param client - The Nexus client instance
     * @returns A promise that resolves to an array of FeeQuote objects.
     *
     * @example
     * ```typescript
     * const supportedTokens = await paymaster.getSupportedTokens(nexusClient);
     * console.log(supportedTokens);
     * ```
     */
    getSupportedTokens: async (client: NexusClient) =>
      getSupportedTokens(client)
  })
