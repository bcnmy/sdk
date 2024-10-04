import type { Chain, Client, Hash, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { safeActivate } from "../../safeActivate"
import { type AddOwnerParameters, addOwner } from "./addOwner"
import { type RemoveOwnerParameters, removeOwner } from "./removeOwner"
import { type SetThresholdParameters, setThreshold } from "./setThreshold"
export type OwnableValidatorActions<
  TSmartAccount extends SmartAccount | undefined
> = {
  addOwner: (args: AddOwnerParameters<TSmartAccount>) => Promise<Hash>
  removeOwner: (args: RemoveOwnerParameters<TSmartAccount>) => Promise<Hash>
  setThreshold: (args: SetThresholdParameters<TSmartAccount>) => Promise<Hash>
}

export function ownableValidatorActions() {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): OwnableValidatorActions<TSmartAccount> => {
    safeActivate(client, "ownable")
    return {
      addOwner: (args) => addOwner(client, args),
      removeOwner: (args) => removeOwner(client, args),
      setThreshold: (args) => setThreshold(client, args)
    }
  }
}

export type { AddOwnerParameters }

export { addOwner, removeOwner, setThreshold }
