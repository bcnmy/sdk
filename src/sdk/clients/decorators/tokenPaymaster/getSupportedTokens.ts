import type { BicoPaymasterClient } from "../../createBicoPaymasterClient"
import type { NexusClient } from "../../createNexusClient"
import type { FeeQuote } from "./getTokenPaymasterQuotes"

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
export const getSupportedTokens = async (
  client: NexusClient
): Promise<FeeQuote[]> => {
  const userOp = await client.prepareUserOperation({
    calls: [
      {
        to: client.account.address,
        data: "0x"
      }
    ]
  })
  const paymaster = client.paymaster as BicoPaymasterClient
  const quote = await paymaster.getTokenPaymasterQuotes({
    userOp,
    tokenList: []
  })

  return quote.feeQuotes
}
