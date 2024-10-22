import type { Chain, Client, Hex, LocalAccount, Transport } from "viem"
import { parseAccount } from "viem/utils"
import { ERROR_MESSAGES } from "../../../account"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { ModularSmartAccount, Module } from "../../utils/Types"

export type GenerateKeyParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** The smart account to add the owner to. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
  /** Optional chainId, defaults to the one in the client */
  chain?: Chain
  /** Optional Signer, defaults to the one in the client */
  signer?: LocalAccount
}

export async function generateKey<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  moduleInfo: Module,
  parameters?: GenerateKeyParameters<TModularSmartAccount>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    chain: chainId_ = client.account?.client?.chain
  } = parameters ?? {}

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }
  const account = parseAccount(account_) as ModularSmartAccount

  if (!chainId_) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  }

  console.log({ moduleInfo })

  return "0x" as Hex
}
