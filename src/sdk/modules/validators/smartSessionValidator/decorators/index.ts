import type { Chain, Client, Hash, Hex, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import type { CreateSessionsResponse } from "../Types"
import { type CreateSessionsParameters, createSessions } from "./createSessions"
import { type UseSessionParameters, useSession } from "./useSession"
export type SmartSessionValidatorActions<
  TSmartAccount extends SmartAccount | undefined
> = {
  createSessions: (
    args: CreateSessionsParameters<TSmartAccount> & {
      signatureOverride?: Hex
    }
  ) => Promise<CreateSessionsResponse>
  useSession: (
    args: UseSessionParameters<TSmartAccount> & {
      signatureOverride?: Hex
    }
  ) => Promise<Hash>
}

export function smartSessionValidatorActions() {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): SmartSessionValidatorActions<TSmartAccount> => ({
    createSessions: (args) => createSessions(client, args),
    useSession: (args) => useSession(client, args)
  })
}

export type { CreateSessionsParameters }

export { createSessions }
