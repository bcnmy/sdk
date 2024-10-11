import type { Chain, Client, Hash, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { activateModule } from "../../activateModule"
import type { CreateSessionsResponse, UseSessionModuleData } from "../Types"
import { type CreateSessionsParameters, createSessions } from "./createSessions"
import { type UseSessionParameters, useSession } from "./useSession"

export type SmartSessionCreateActions<
  TSmartAccount extends SmartAccount | undefined
> = {
  createSessions: (
    args: CreateSessionsParameters<TSmartAccount>
  ) => Promise<CreateSessionsResponse>
}
export type SmartSessionUseActions<
  TSmartAccount extends SmartAccount | undefined
> = {
  useSession: (
    args: UseSessionParameters<TSmartAccount> & { data: UseSessionModuleData }
  ) => Promise<Hash>
}

export function smartSessionCreateActions() {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): SmartSessionCreateActions<TSmartAccount> => {
    return {
      createSessions: (args) => createSessions(client, args)
    }
  }
}
export function smartSessionUseActions() {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): SmartSessionUseActions<TSmartAccount> => {
    return {
      useSession: (args) => {
        activateModule(client, "smartSession", args.data)
        return useSession(client, args)
      }
    }
  }
}

export type { CreateSessionsParameters, UseSessionParameters }

export { createSessions, useSession }
