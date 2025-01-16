import type { Hex, TransactionReceipt } from "viem"
import type { BaseMeeClient } from "../../createMeeClient"
import type { ExecuteSignedQuotePayload } from "./executeSignedQuote"
import type { SignFusionQuotePayload } from "./signFusionQuote"

export type ExecuteSignedFusionQuoteParams = {
  /** Quote to be executed */
  signedFusionQuote: SignFusionQuotePayload
}

export type ExecuteSignedFusionQuotePayload = {
  /** Hash of the executed transaction */
  hash: Hex
  /** Transaction receipt */
  receipt: TransactionReceipt
}

/**
 * Executes a signed quote.
 * @param client - The Mee client to use
 * @param params - The parameters for executing the signed quote
 * @returns The hash of the executed transaction
 * @example
 * const hash = await executeSignedFusionQuote(client, {
 *   signedFusionQuote: {
 *     ...
 *   }
 * })
 */
export const executeSignedFusionQuote = async (
  client: BaseMeeClient,
  params: ExecuteSignedFusionQuoteParams
): Promise<ExecuteSignedFusionQuotePayload> => {
  const { receipt, ...signedFusionQuote } = params.signedFusionQuote

  const { hash } = await client.request<ExecuteSignedQuotePayload>({
    path: "v1/exec",
    body: signedFusionQuote
  })

  return {
    hash,
    receipt
  }
}

export default executeSignedFusionQuote
