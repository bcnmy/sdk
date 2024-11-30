import type { Client, Transport } from "viem"
import type {
  AnyData,
  ModularSmartAccount
} from "../../../../modules/utils/Types"
import type { MeeClient } from "../../../createMeeClient"
import { type MeeActionParameters, meeAction } from "./meeAction"

export type MeeActions = {
  meeAction: (
    parameters: MeeActionParameters<ModularSmartAccount>
  ) => Promise<AnyData>
}

export function meeActions<
  transport extends Transport = Transport,
  account extends ModularSmartAccount = ModularSmartAccount
>(client: Client<transport, undefined, account>): MeeActions {
  return {
    meeAction: (parameters) =>
      meeAction(client as MeeClient<transport, account>, parameters)
  }
}
