import type { Module as ModuleMeta } from "@rhinestone/module-sdk"
import type { Chain, Client, Hash, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { activateModule } from "../../utils/activateModule"
import { type AddOwnerParameters, addOwner } from "./addOwner"
import { type InstallOwnablesParameters, install } from "./install"
import { type RemoveOwnerParameters, removeOwner } from "./removeOwner"
import { type SetThresholdParameters, setThreshold } from "./setThreshold"

export type OwnableValidatorActions<
  TSmartAccount extends SmartAccount | undefined,
  TModuleMeta extends ModuleMeta | undefined
> = {
  install: (
    args?: InstallOwnablesParameters<TSmartAccount, TModuleMeta>
  ) => Promise<Hash>
  addOwner: (args: AddOwnerParameters<TSmartAccount>) => Promise<Hash>
  removeOwner: (args: RemoveOwnerParameters<TSmartAccount>) => Promise<Hash>
  setThreshold: (args: SetThresholdParameters<TSmartAccount>) => Promise<Hash>
}

export function ownableActions() {
  return <
    TSmartAccount extends SmartAccount | undefined,
    TModuleMeta extends ModuleMeta | undefined
  >(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): OwnableValidatorActions<TSmartAccount, TModuleMeta> => {
    return {
      install: (args) => {
        activateModule("k1", client.account)
        return install(client, args)
      },
      addOwner: (args) => {
        activateModule("ownable", client.account)
        return addOwner(client, args)
      },
      removeOwner: (args) => {
        activateModule("ownable", client.account)
        return removeOwner(client, args)
      },
      setThreshold: (args) => {
        activateModule("ownable", client.account)
        return setThreshold(client, args)
      }
    }
  }
}

export type { AddOwnerParameters }

export { addOwner, removeOwner, setThreshold }
