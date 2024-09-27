import type { Chain, Client, Hash, Hex, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import type { EnableSessionsResponse } from "./Types"
import { type EnableSessionsParameters, enableSessions } from "./enableSessions"
import {
  type UseEnabledSessionParameters,
  useEnabledSession
} from "./useEnabledSession"
export type SmartSessionValidatorActions<
  TSmartAccount extends SmartAccount | undefined
> = {
  enableSessions: (
    args: EnableSessionsParameters<TSmartAccount> & {
      signatureOverride?: Hex
    }
  ) => Promise<EnableSessionsResponse>
  useEnabledSession: (
    args: UseEnabledSessionParameters<TSmartAccount> & {
      signatureOverride?: Hex
    }
  ) => Promise<Hash>
}

export function smartSessionValidatorActions() {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): SmartSessionValidatorActions<TSmartAccount> => ({
    enableSessions: (args) => enableSessions(client, args),
    useEnabledSession: (args) => useEnabledSession(client, args)
  })
}

export type { EnableSessionsParameters }

export { enableSessions }
