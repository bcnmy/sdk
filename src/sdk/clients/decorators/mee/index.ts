import type { AnyData, ModularSmartAccount } from "../../../modules/utils/Types"
import type { BaseMeeService } from "../../createMeeService"
import { type GetFeeQuoteParameters, getFeeQuote } from "./getFeeQuote"

export type MeeActions = {
  getFeeQuote: (
    parameters: GetFeeQuoteParameters<ModularSmartAccount>
  ) => Promise<AnyData>
  sendPreparedSuperTransaction: () => void
  sendSuperTransaction: () => void
}

export function meeActions(client: BaseMeeService): MeeActions {
  return {
    getFeeQuote: (parameters) => getFeeQuote(client, parameters),
    sendPreparedSuperTransaction: () => {
      // Sends a prepared super transaction with the retrievedfee quote
    }, // etc etc
    sendSuperTransaction: () => {
      // Pairs fetching the fee quote with sending the super transaction
      // getFeeQuote
      // then...
      // sendSuperTransactions
    }
  }
}
