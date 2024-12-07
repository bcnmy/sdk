import type { AnyData, ModularSmartAccount } from "../../../modules/utils/Types"
import type { BaseMeeAgent } from "../../createMeeAgent"
import { type GetFeeQuoteParameters, getFeeQuote } from "./getFeeQuote"

export type MeeActions = {
  getFeeQuote: (
    parameters: GetFeeQuoteParameters<ModularSmartAccount>
  ) => Promise<AnyData>
  sendSuperTransaction: () => void
}

export function meeActions(client: BaseMeeAgent): MeeActions {
  return {
    getFeeQuote: (parameters) => getFeeQuote(client, parameters),
    sendSuperTransaction: () => {} // etc etc
  }
}
