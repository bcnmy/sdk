import type { Hex } from "viem"
import type { BaseMeeClient } from "../../createMeeClient"
import type { SignQuotePayload } from "./signQuote"

export type ExecuteSignedQuoteParams = {
  /** Quote to be executed */
  signedQuote: SignQuotePayload
}

export type ExecuteSignedQuotePayload = {
  /** Hash of the executed transaction */
  hash: Hex
}

/**
 * Executes a signed quote.
 * @param client - The Mee client to use
 * @param params - The parameters for executing the signed quote
 * @returns The hash of the executed transaction
 * @example
 * const hash = await executeSignedQuote(client, {
 *   signedQuote: {
 *     ...
 *   }
 * })
 */
export const executeSignedQuote = async (
  client: BaseMeeClient,
  params: ExecuteSignedQuoteParams
): Promise<ExecuteSignedQuotePayload> =>
  client.request<ExecuteSignedQuotePayload>({
    path: "v1/exec",
    body: params.signedQuote
  })

export default executeSignedQuote
