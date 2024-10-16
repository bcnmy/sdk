import {
  getAccount,
  getOwnableValidatorThreshold
} from "@rhinestone/module-sdk"
import type { Chain, Client, PublicClient, Transport } from "viem"
import type {
  GetSmartAccountParameter,
  SmartAccount
} from "viem/account-abstraction"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"

export type GetThresholdParameters<
  TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount>

export async function getThreshold<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters?: GetThresholdParameters<TSmartAccount>
): Promise<number> {
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

  return await getOwnableValidatorThreshold({
    account: nexusAccount,
    client: publicClient as PublicClient
  })
}
