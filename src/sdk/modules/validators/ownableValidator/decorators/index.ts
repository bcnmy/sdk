import type { Chain, Client, Hash, Hex, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { type AddOwnerParameters, addOwner } from "./addOwner"
import { type RemoveOwnerParameters, removeOwner } from "./removeOwner"
import { type SetThresholdParameters, setThreshold } from "./setThreshold"
export type OwnableValidatorActions<
  TSmartAccount extends SmartAccount | undefined
> = {
  addOwner: (
    args: AddOwnerParameters<TSmartAccount> & {
      signatureOverride?: Hex
    }
  ) => Promise<Hash>
  removeOwner: (
    args: RemoveOwnerParameters<TSmartAccount> & {
      signatureOverride?: Hex
    }
  ) => Promise<Hash>
  setThreshold: (
    args: SetThresholdParameters<TSmartAccount> & {
      signatureOverride?: Hex
    }
  ) => Promise<Hash>
}

export function ownableValidatorActions() {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): OwnableValidatorActions<TSmartAccount> => ({
    addOwner: (args) => addOwner(client, args),
    removeOwner: (args) => removeOwner(client, args),
    setThreshold: (args) => setThreshold(client, args)
  })
}

export type { AddOwnerParameters }

export { addOwner, removeOwner, setThreshold }
