import type { Chain, Client, Transport } from "viem"
import type { ModularSmartAccount } from "../../../../modules/utils/Types"
import { type KeyGenParameters, type KeyGenResponse, keyGen } from "./keyGen"
import { type SigGenParameters, type SigGenResponse, sigGen } from "./sigGen"

export type DanActions<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  keyGen: (
    args?: KeyGenParameters<TModularSmartAccount>
  ) => Promise<KeyGenResponse>
  sigGen: (parameters: SigGenParameters) => Promise<SigGenResponse>
}

export function danActions() {
  return <
    TModularSmartAccount extends ModularSmartAccount | undefined,
    chain extends Chain | undefined
  >(
    client: Client<Transport, chain, TModularSmartAccount>
  ): DanActions<TModularSmartAccount> => {
    return {
      keyGen: (args) => keyGen(client, args),
      sigGen: (parameters) => sigGen(client, parameters)
    }
  }
}
