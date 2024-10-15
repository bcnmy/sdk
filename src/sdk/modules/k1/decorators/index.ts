import type { Module as ModuleMeta } from "@rhinestone/module-sdk"
import type { Chain, Client, Hash, Hex, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { activateModule } from "../../utils/activateModule"
import { type InstallK1Parameters, install } from "./install"

export type SmartSessionCreateActions<
  TSmartAccount extends SmartAccount | undefined,
  TModuleMeta extends ModuleMeta | undefined
> = {
  install: (
    args?: InstallK1Parameters<TSmartAccount, TModuleMeta>
  ) => Promise<Hex>
}
export function k1Actions() {
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
      }
    }
  }
}
