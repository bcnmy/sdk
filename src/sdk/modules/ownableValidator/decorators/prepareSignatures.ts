import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import { encodePacked, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { ModularSmartAccount } from "../../utils/Types"

export type PrepareSignaturesParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  account?: TModularSmartAccount
  signatures: Hex[]
}

export async function prepareSignatures<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters: PrepareSignaturesParameters<TModularSmartAccount>
): Promise<Hex> {
  const { account: account_ = client.account, signatures } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as ModularSmartAccount
  const publicClient = account?.client as PublicClient

  if (!publicClient) {
    throw new Error("Public client not found")
  }

  return encodePacked(
    signatures.map(() => "bytes"),
    signatures
  )
}
