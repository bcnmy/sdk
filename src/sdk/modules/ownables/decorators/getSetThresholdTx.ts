import { getSetOwnableValidatorThresholdAction } from "@rhinestone/module-sdk"
import type { Chain, Client, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { Call } from "../../../account/utils/Types"

export type GetSetThresholdTxParameters<
  TSmartAccount extends SmartAccount | undefined
> = {
  account?: TSmartAccount
  threshold: number
}

export async function getSetThresholdTx<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: GetSetThresholdTxParameters<TSmartAccount>
): Promise<Call> {
  const { account: account_ = client.account, threshold } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount

  if (!account) throw new Error("Account not found")

  const action = getSetOwnableValidatorThresholdAction({
    threshold
  })

  if (!("callData" in action)) {
    throw new Error("Error getting set threshold actions")
  }

  return {
    to: action.target,
    value: BigInt(action.value.toString()),
    data: action.callData
  }
}
