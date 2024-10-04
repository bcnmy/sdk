import type { Chain, Client, Hash, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { safeActivate } from "../../safeActivate"
import type { CreateSessionsResponse, SmartSessionMetaData } from "../Types"
import { type CreateSessionsParameters, createSessions } from "./createSessions"
import { type UseSessionParameters, useSession } from "./useSession"

export type SmartSessionValidatorActions<
  TSmartAccount extends SmartAccount | undefined
> = {
  createSessions: (
    args: CreateSessionsParameters<TSmartAccount>
  ) => Promise<CreateSessionsResponse>
  useSession: (args: UseSessionParameters<TSmartAccount>) => Promise<Hash>
}

export function smartSessionValidatorActions(metaData?: SmartSessionMetaData) {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): SmartSessionValidatorActions<TSmartAccount> => {
    safeActivate(client, "smartSession")

    return {
      createSessions: (args) => createSessions(client, args),
      useSession: (args) => useSession(client, args, metaData)
    }
  }
}

export type { CreateSessionsParameters }

export { createSessions }
