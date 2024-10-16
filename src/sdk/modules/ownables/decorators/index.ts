import type { Address, Chain, Client, Hash, Hex, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
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
export type OwnableActions<TSmartAccount extends SmartAccount | undefined> = {
  getRemoveOwnerTx: (
    args: GetRemoveOwnerTxParameters<TSmartAccount>
  ) => Promise<Call>
  addOwner: (args: AddOwnerParameters<TSmartAccount>) => Promise<Hash>
  removeOwner: (args: RemoveOwnerParameters<TSmartAccount>) => Promise<Hash>
  setThreshold: (args: SetThresholdParameters<TSmartAccount>) => Promise<Hash>
  getOwners: (args?: GetOwnersParameters<TSmartAccount>) => Promise<Address[]>
  getSetThresholdTx: (
    args: GetSetThresholdTxParameters<TSmartAccount>
  ) => Promise<Call>
  getAddOwnerTx: (args: AddOwnerParameters<TSmartAccount>) => Promise<Call>
  prepareSignatures: (
    args: PrepareSignaturesParameters<TSmartAccount>
  ) => Promise<Hex>
  getThreshold: (
    args?: GetThresholdParameters<TSmartAccount>
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
