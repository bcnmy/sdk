import type { Chain, Client, Transport } from "viem"
import type { Module } from "../../../modules"
import type { ModularSmartAccount } from "../../../modules/utils/Types"

export type ModuleActions = Record<string, never>

export function moduleActivator(module: Module) {
  return <TModularSmartAccount extends ModularSmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TModularSmartAccount>
  ): ModuleActions => {
    client?.account?.setModule(module)
    return {} as ModuleActions
  }
}
