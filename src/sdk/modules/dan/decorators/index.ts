import type { Chain, Client, Hex, Transport } from "viem"
import type { PrepareUserOperationParameters } from "viem/account-abstraction"
import type { ModularSmartAccount } from "../../utils/Types"
import type { DanModule } from "../toDan"
import {
  type GenerateMPCKeyParameters,
  type GenerateMPCKeyResponse,
  generateMPCKey
} from "./generateMPCKey"
import { sendUserOperation } from "./sendUserOperation"

export type DanActions<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  generateMPCKey: (
    args?: GenerateMPCKeyParameters<TModularSmartAccount>
  ) => Promise<GenerateMPCKeyResponse>
  sendUserOperation: (
    parameters: PrepareUserOperationParameters
  ) => Promise<Hex>
}

export function danActions(moduleInfo: DanModule) {
  return <
    TModularSmartAccount extends ModularSmartAccount | undefined,
    chain extends Chain | undefined
  >(
    client: Client<Transport, chain, TModularSmartAccount>
  ): DanActions<TModularSmartAccount> => {
    client?.account?.setModule(moduleInfo)
    return {
      generateMPCKey: (args) => generateMPCKey(client, args),
      sendUserOperation: (parameters) => sendUserOperation(client, parameters)
    }
  }
}
