import type { Client, Transport } from "viem"
import type { AnyData, ModularSmartAccount } from "../../../modules/utils/Types"
import type { MeeClient } from "../../createMeeClient"
import {
  type PrepareSuperTransactionParameters,
  prepareSuperTransaction
} from "./prepareSuperTransaction"

export type MeeActions = {
  prepareSuperTransaction: (
    parameters: PrepareSuperTransactionParameters<ModularSmartAccount>
  ) => Promise<AnyData>
  sendSuperTransaction: () => void
}

export function meeActions<
  transport extends Transport = Transport,
  account extends ModularSmartAccount = ModularSmartAccount
>(client: Client<transport, undefined, account>): MeeActions {
  return {
    prepareSuperTransaction: (parameters) =>
      prepareSuperTransaction(
        client as MeeClient<transport, account>,
        parameters
      ),
    sendSuperTransaction: () => {} // etc etc
  }
}
