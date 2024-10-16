import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { encodePacked, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"

export type PrepareSignaturesParameters<
  TSmartAccount extends SmartAccount | undefined
> = {
  account?: TSmartAccount
  signatures: Hex[]
}

export async function prepareSignatures<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: PrepareSignaturesParameters<TSmartAccount>
): Promise<Hex> {
  const { account: account_ = client.account, signatures } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount
  const publicClient = account?.client as PublicClient

  if (!publicClient) {
    throw new Error("Public client not found")
  }

  return encodePacked(
    signatures.map(() => "bytes"),
    signatures
  )
}
