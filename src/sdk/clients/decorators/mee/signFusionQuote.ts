import {
  http,
  type Chain,
  type Hex,
  type TransactionReceipt,
  concatHex,
  createWalletClient,
  encodeAbiParameters,
  publicActions
} from "viem"
import type { MultichainSmartAccount } from "../../../account/toMultiChainNexusAccount"
import type { Call } from "../../../account/utils/Types"
import type { BaseMeeClient } from "../../createMeeClient"
import type { GetQuotePayload } from "./getQuote"
import { type MeeExecutionMode, PREFIX } from "./signQuote"

export const FUSION_NATIVE_TRANSFER_PREFIX = "0x150b7a02"

/**
 * Parameters required for requesting a quote from the MEE service
 * @interface SignFusionQuoteParams
 */
export type SignFusionQuoteParams = {
  /** The quote to sign */
  quote: GetQuotePayload
  /** Optional smart account to execute the transaction. If not provided, uses the client's default account */
  account?: MultichainSmartAccount
  /** The execution mode to use. Defaults to "direct-to-mee" */
  executionMode?: MeeExecutionMode
  /** The on-chain transaction to use as the trigger */
  trigger: {
    /** The on-chain transaction to use as the trigger */
    call: Call
    /** The chain to use */
    chain: Chain
  }
}

export type SignFusionQuotePayload = GetQuotePayload & {
  /** The signature of the quote */
  signature: Hex
  /** The transaction receipt */
  receipt: TransactionReceipt
}

/**
 * Signs a fusion quote
 * @param client - The Mee client to use
 * @param params - The parameters for the fusion quote
 * @returns The signed quote
 * @example
 * const signedQuote = await signFusionQuote(meeClient, {
 *   quote: quotePayload,
 *   account: smartAccount
 * })
 */
export const signFusionQuote = async (
  client: BaseMeeClient,
  params: SignFusionQuoteParams
): Promise<SignFusionQuotePayload> => {
  const {
    account: account_ = client.account,
    quote,
    executionMode = "fusion-with-onchain-tx",
    trigger: { call: call_, chain }
  } = params

  // If the data field is empty, a prefix must be added in order for the
  // chain not to reject the transaction. This is done in cases when the
  // user is using the transfer of native gas to the SCA as the trigger
  // transaction
  const call = {
    ...call_,
    data: concatHex([
      call_.data ?? FUSION_NATIVE_TRANSFER_PREFIX,
      PREFIX[executionMode],
      quote.hash
    ])
  }

  const signer = account_.signer
  const masterClient = createWalletClient({
    account: signer,
    chain,
    transport: http()
  }).extend(publicActions)

  const hash = await masterClient.sendTransaction(call)
  const receipt = await masterClient.waitForTransactionReceipt({ hash })
  const signature = concatHex([
    PREFIX[executionMode],
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "uint256" }],
      [hash, BigInt(chain.id)]
    )
  ])

  return {
    receipt,
    ...quote,
    signature
  }
}

export default signFusionQuote
