import type { FeeTokenInfo } from "../../clients/decorators/mee/getQuote"
import type { MultichainToken } from "./Types"

/**
 * Converts a multichain token to fee token information for a specific chain
 *
 * @param params - Configuration for the fee token conversion
 * @param params.token - {@link MultichainToken} The multichain token to convert
 * @param params.chainId - The numeric ID of the chain to get the token address for
 *
 * @returns {@link FeeTokenInfo} The fee token information for the specified chain
 *
 * @example
 * const feeToken = toFeeToken({
 *   token: mcUSDC,
 *   chainId: 10 // Optimism
 * });
 *
 * console.log(feeToken);
 * // {
 * //   address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
 * //   chainId: 10
 * // }
 */
export function toFeeToken(params: {
  token: MultichainToken
  chainId: number
}): FeeTokenInfo {
  return {
    address: params.token.addressOn(params.chainId),
    chainId: params.chainId
  }
}
