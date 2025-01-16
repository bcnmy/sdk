import type { BaseMeeClient } from "../../createMeeClient"
import {
  type ExecuteSignedQuotePayload,
  executeSignedQuote
} from "./executeSignedQuote"
import { type SignQuoteParams, signQuote } from "./signQuote"

/**
 * Executes a quote by signing it and then executing the signed quote.
 * @param client - The Mee client to use
 * @param params - The parameters for signing the quote
 * @returns The hash of the executed transaction
 * @example
 * const hash = await executeQuote(client, {
 *   quote: {
 *     ...
 *   }
 * })
 */
export const executeQuote = async (
  client: BaseMeeClient,
  params: SignQuoteParams
): Promise<ExecuteSignedQuotePayload> => {
  const signedQuote = await signQuote(client, params)
  return executeSignedQuote(client, { signedQuote })
}

export default executeQuote
