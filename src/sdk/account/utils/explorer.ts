import type { Chain, Hex } from "viem"
import type { Url } from "../../clients/createHttpClient"
import { getChain } from "./getChain"

/**
 * Get the explorer tx link
 * @param hash - The transaction hash
 * @param chain - The chain
 * @returns The explorer tx link
 *
 * @example
 * ```ts
 * const hash = "0x123"
 * const chain = optimism
 * const url = getExplorerTxLink(hash, chain)
 * console.log(url) // https://meescan.biconomy.io/details/0x123
 * ```
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
 * Get the jiffyscan tx link
 * @param hash - The transaction hash
 * @returns The jiffyscan tx link
 *
 * @example
 * ```ts
 * const hash = "0x123"
 * const url = getJiffyScanLink(hash)
 * console.log(url) // https://jiffyscan.com/tx/0x123
 * ```
 */
export const getJiffyScanLink = (userOpHash: Hex): Url => {
  return `https://v2.jiffyscan.xyz/tx/${userOpHash}` as Url
}

/**
 * Get the meescan tx link
 * @param hash - The transaction hash
 * @returns The meescan tx link
 *
 * @example
 * ```ts
 * const hash = "0x123"
 * const url = getMeeScanLink(hash)
 * console.log(url) // https://meescan.biconomy.io/details/0x123
 * ```
 */
export const getMeeScanLink = (hash: Hex): Url => {
  return `https://meescan.biconomy.io/details/${hash}` as Url
}
