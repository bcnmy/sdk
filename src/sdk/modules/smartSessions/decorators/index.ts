import type { Module as ModuleMeta } from "@rhinestone/module-sdk"
import type { Chain, Client, Hash, Hex, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { activateModule } from "../../utils/activateModule"
import type { CreateSessionsResponse, UseSessionModuleData } from "../Types"
import { type CreateSessionsParameters, createSessions } from "./createSessions"
import { type InstallSessionsParameters, install } from "./install"
import { type UseSessionParameters, useSession } from "./useSession"

export type SmartSessionCreateActions<
  TSmartAccount extends SmartAccount | undefined,
  TModuleMeta extends ModuleMeta | undefined
> = {
  install: (
    args?: InstallSessionsParameters<TSmartAccount, TModuleMeta>
  ) => Promise<Hex>
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
  return <
    TSmartAccount extends SmartAccount | undefined,
    TModuleMeta extends ModuleMeta | undefined
  >(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): SmartSessionCreateActions<TSmartAccount, TModuleMeta> => {
    return {
      install: (args) => {
        activateModule("k1", client.account)
        return install(client, args)
      },
      createSessions: (args) => {
        activateModule("k1", client.account)
        return createSessions(client, args)
      }
    }
  }
}
export function smartSessionUseActions() {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): SmartSessionUseActions<TSmartAccount> => {
    return {
      useSession: (args) => {
        activateModule("useSession", client.account, args.data)
        return useSession(client, args)
      }
    }
  }
}

export type { CreateSessionsParameters, UseSessionParameters }

export { createSessions, useSession }
