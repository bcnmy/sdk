import type { Chain, Client, Transport } from "viem"
import type { Module } from "../../../modules"
import type { ModularSmartAccount } from "../../../modules/utils/Types"

export type ModuleActions = Record<string, never>

/**
 * Creates a decorator function that activates a specific module for a modular smart account client
 * @param module - The module to be activated on the smart account
 * @returns An empty object
 * @remarks This decorator is used to only set the module on the client
 */
export function moduleActivator(module: Module) {
  return <TModularSmartAccount extends ModularSmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TModularSmartAccount>
  ): ModuleActions => {
    client?.account?.setModule(module)
    return {} as ModuleActions
  }
}
