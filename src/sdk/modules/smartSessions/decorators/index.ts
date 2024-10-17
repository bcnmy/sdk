import type { Chain, Client, Hash, Transport } from "viem"
import type { ModularSmartAccount, Module } from "../../utils/Types"
import type { CreateSessionsResponse } from "../Types"
import { type CreateSessionsParameters, createSessions } from "./createSessions"
import { type UseSessionParameters, useSession } from "./useSession"

export type SmartSessionCreateActions<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  createSessions: (
    args: CreateSessionsParameters<TModularSmartAccount>
  ) => Promise<CreateSessionsResponse>
}
export type SmartSessionUseActions<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  useSession: (
    args: UseSessionParameters<TModularSmartAccount>
  ) => Promise<Hash>
}

export function smartSessionCreateActions(_: Module) {
  return <TModularSmartAccount extends ModularSmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TModularSmartAccount>
  ): SmartSessionCreateActions<TModularSmartAccount> => {
    return {
      createSessions: (args) => createSessions(client, args)
    }
  }
}
export function smartSessionUseActions(smartSessionsModule: Module) {
  return <TModularSmartAccount extends ModularSmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TModularSmartAccount>
  ): SmartSessionUseActions<TModularSmartAccount> => {
    client?.account?.setModule(smartSessionsModule)
    return {
      useSession: (args) => useSession(client, args)
    }
  }
}

export type { CreateSessionsParameters, UseSessionParameters }

export { createSessions, useSession }
