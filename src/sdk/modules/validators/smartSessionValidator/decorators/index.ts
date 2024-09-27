import type { Chain, Client, Hash, Hex, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { type EnableSessionsParameters, enableSessions } from "./enableSessions"
export type SmartSessionValidatorActions<
  TSmartAccount extends SmartAccount | undefined
> = {
  enableSessions: (
    args: EnableSessionsParameters<TSmartAccount> & {
      signatureOverride?: Hex
    }
  ) => Promise<Hash>
}

export function smartSessionValidatorActions() {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): SmartSessionValidatorActions<TSmartAccount> => ({
    enableSessions: (args) => enableSessions(client, args)
  })
}

export type { EnableSessionsParameters }

export { enableSessions }
