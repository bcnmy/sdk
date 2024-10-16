import { getAccount, getOwnableValidatorOwners } from "@rhinestone/module-sdk"
import type { Address, Chain, Client, PublicClient, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"

export type GetOwnersParameters<
  TSmartAccount extends SmartAccount | undefined
> = {
  account?: TSmartAccount
}

export async function getOwners<TSmartAccount extends SmartAccount | undefined>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters?: GetOwnersParameters<TSmartAccount>
): Promise<Address[]> {
  const { account: account_ = client.account } = parameters ?? {}

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

  const nexusAccount = getAccount({
    address: account.address,
    type: "nexus"
  })

  return getOwnableValidatorOwners({
    account: nexusAccount,
    client: publicClient as PublicClient
  })
}
