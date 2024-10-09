import type {
  Chain,
  Client,
  PublicClient,
  Transport,
  WaitForTransactionReceiptParameters,
  WaitForTransactionReceiptReturnType
} from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"

export async function waitForTransactionReceipt<
  TAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TAccount>,
  {
    account: account_ = client.account,
    hash
  }: WaitForTransactionReceiptParameters & { account?: TAccount }
): Promise<WaitForTransactionReceiptReturnType> {
  if (!account_)
    throw new AccountNotFoundError({
      docsPath: "/docs/actions/wallet/waitForTransactionReceipt"
    })

  const account = parseAccount(account_) as SmartAccount
  const accountClient = account?.client as PublicClient

  if (!accountClient) throw new Error("Requires a Public Client")

  return accountClient.waitForTransactionReceipt({ hash })
}
