import type { Chain, Client, Hash, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import type { CreateSessionsResponse, SmartSessionMetaData } from "../Types"
import { type CreateSessionsParameters, createSessions } from "./createSessions"
import { type UseSessionParameters, useSession } from "./useSession"
import { activateModule } from "../../activateModule"

export type SmartSessionValidatorActions<
  TSmartAccount extends SmartAccount | undefined
> = {
  createSessions: (
    args: CreateSessionsParameters<TSmartAccount>
  ) => Promise<CreateSessionsResponse>
  useSession: (args: UseSessionParameters<TSmartAccount>) => Promise<Hash>
}

export function smartSessionValidatorActions(
  moduleData?: SmartSessionMetaData
) {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): SmartSessionValidatorActions<TSmartAccount> => {
    activateModule(client, "smartSession", moduleData)

    return {
      createSessions: (args) => createSessions(client, args),
      useSession: (args) => useSession(client, args)
    }
  }
}

export type { CreateSessionsParameters }

export { createSessions }
