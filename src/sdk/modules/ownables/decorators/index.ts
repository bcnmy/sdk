import type { Address, Chain, Client, Hash, Hex, Transport } from "viem"
import type { Call } from "../../../account/utils/Types"
import type { ModularSmartAccount, Module } from "../../utils/Types"
import { type AddOwnerParameters, addOwner } from "./addOwner"
import { getAddOwnerTx } from "./getAddOwnerTx"
import { type GetOwnersParameters, getOwners } from "./getOwners"
import {
  type GetRemoveOwnerTxParameters,
  getRemoveOwnerTx
} from "./getRemoveOwnerTx"
import {
  type GetSetThresholdTxParameters,
  getSetThresholdTx
} from "./getSetThresholdTx"
import { type GetThresholdParameters, getThreshold } from "./getThreshold"
import {
  type PrepareSignaturesParameters,
  prepareSignatures
} from "./prepareSignatures"
import { type RemoveOwnerParameters, removeOwner } from "./removeOwner"
import { type SetThresholdParameters, setThreshold } from "./setThreshold"
export type OwnableActions<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  getRemoveOwnerTx: (
    args: GetRemoveOwnerTxParameters<TModularSmartAccount>
  ) => Promise<Call>
  addOwner: (args: AddOwnerParameters<TModularSmartAccount>) => Promise<Hash>
  removeOwner: (
    args: RemoveOwnerParameters<TModularSmartAccount>
  ) => Promise<Hash>
  setThreshold: (
    args: SetThresholdParameters<TModularSmartAccount>
  ) => Promise<Hash>
  getOwners: (
    args?: GetOwnersParameters<TModularSmartAccount>
  ) => Promise<Address[]>
  getSetThresholdTx: (
    args: GetSetThresholdTxParameters<TModularSmartAccount>
  ) => Promise<Call>
  getAddOwnerTx: (
    args: AddOwnerParameters<TModularSmartAccount>
  ) => Promise<Call>
  prepareSignatures: (
    args: PrepareSignaturesParameters<TModularSmartAccount>
  ) => Promise<Hex>
  getThreshold: (
    args?: GetThresholdParameters<TModularSmartAccount>
  ) => Promise<number>
}

export function ownableActions(ownableModule: Module) {
  return <TModularSmartAccount extends ModularSmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TModularSmartAccount>
  ): OwnableActions<TModularSmartAccount> => {
    client?.account?.setModule(ownableModule)
    return {
      getThreshold: (args) => {
        return getThreshold(client, args)
      },
      prepareSignatures: (args) => {
        return prepareSignatures(client, args)
      },
      getAddOwnerTx: (args) => {
        return getAddOwnerTx(client, args)
      },
      getOwners: (args) => {
        return getOwners(client, args)
      },
      getSetThresholdTx: (args) => {
        return getSetThresholdTx(client, args)
      },
      getRemoveOwnerTx: (args) => {
        return getRemoveOwnerTx(client, args)
      },
      addOwner: (args) => {
        return addOwner(client, args)
      },
      removeOwner: (args) => {
        return removeOwner(client, args)
      },
      setThreshold: (args) => {
        return setThreshold(client, args)
      }
    }
  }
}
