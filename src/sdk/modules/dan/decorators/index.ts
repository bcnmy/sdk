import type { Chain, Client, Hex, Transport } from "viem"
import type { PrepareUserOperationParameters } from "viem/account-abstraction"
import type { ModularSmartAccount, Module } from "../../utils/Types"
import { type GenerateKeyParameters, generateKey } from "./generateKey"
import {
  type DANUserOperation,
  prepareDANUserOperation
} from "./prepareDANUserOperation"

export type DanActions<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  generateKey: (
    args?: GenerateKeyParameters<TModularSmartAccount>
  ) => Promise<Hex>
  prepareDANUserOperation: (
    parameters: PrepareUserOperationParameters
  ) => Promise<DANUserOperation>
}

export function danActions(moduleInfo: Module) {
  return <TModularSmartAccount extends ModularSmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TModularSmartAccount>
  ): DanActions<TModularSmartAccount> => {
    client?.account?.setModule(moduleInfo)
    return {
      generateKey: (args) => generateKey(client, moduleInfo, args),
      prepareDANUserOperation: (parameters) =>
        prepareDANUserOperation(client, parameters)
    }
  }
}
