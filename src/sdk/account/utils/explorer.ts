import type { Chain, Hex } from "viem"
import type { Url } from "../../clients/createHttpClient"
import { getChain } from "./getChain"

/**
 * Gets the block explorer transaction link for a given chain
 *
 * @param hash - {@link Hex} The transaction hash to view
 * @param chain_ - {@link Chain} The chain object, chain ID, or chain name
 * @returns {@link Url} The complete URL to view the transaction
 *
 * @throws Error if the chain has no block explorer configured
 *
 * @example
 * // Using chain object
 * const url = getExplorerTxLink(
 *   "0x123...",
 *   optimism
 * );
 *
 * @example
 * // Using chain ID
 * const url = getExplorerTxLink(
 *   "0x123...",
 *   10 // Optimism chain ID
 * );
 */
export const getExplorerTxLink = (
  hash: Hex,
  chain_: Chain | number | string
): Url => {
  const chain: Chain =
    typeof chain_ === "number" || typeof chain_ === "string"
      ? getChain(Number(chain_))
      : chain_

  return `${chain.blockExplorers?.default.url}/tx/${hash}` as Url
}

/**
 * Gets the JiffyScan transaction link for a user operation
 *
 * @param userOpHash - {@link Hex} The user operation hash to view
 * @returns {@link Url} The complete URL to view the user operation on JiffyScan
 *
 * @example
 * const url = getJiffyScanLink("0x123...");
 * console.log(url); // https://v2.jiffyscan.xyz/tx/0x123...
 */
export const getJiffyScanLink = (userOpHash: Hex): Url => {
  return `https://v2.jiffyscan.xyz/tx/${userOpHash}` as Url
}

/**
 * Gets the MeeScan transaction link for a user operation
 *
 * @param hash - {@link Hex} The transaction or user operation hash to view
 * @returns {@link Url} The complete URL to view the transaction on MeeScan
 *
 * @example
 * const url = getMeeScanLink("0x123...");
 * console.log(url); // https://meescan.biconomy.io/details/0x123...
 */
export const getMeeScanLink = (hash: Hex): Url => {
  return `https://meescan.biconomy.io/details/${hash}` as Url
}
