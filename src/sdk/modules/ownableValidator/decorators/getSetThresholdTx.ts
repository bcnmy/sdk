import { getSetOwnableValidatorThresholdAction } from "@rhinestone/module-sdk"
import type { Chain, Client, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { Call } from "../../../account/utils/Types"

/**
 * Parameters for generating a transaction to set the threshold for a smart account.
 *
 * @template TSmartAccount - Type of the smart account, extending SmartAccount or undefined.
 * @property account - The smart account to set the threshold for. Optional if client has an account.
 * @property threshold - The new threshold value to set. Determines the number of required signatures.
 */
export type GetSetThresholdTxParameters<
  TSmartAccount extends SmartAccount | undefined
> = {
  account?: TSmartAccount
  threshold: number
}

/**
 * Generates transaction data for setting a new threshold on a smart account.
 *
 * The threshold in a multi-signature wallet determines how many owners need to approve
 * a transaction before it can be executed. This function prepares the transaction data
 * needed to change this threshold, but does not actually send the transaction.
 *
 * @template TSmartAccount - Type of the smart account, extending SmartAccount or undefined.
 * @param client - The client instance used for blockchain interactions.
 * @param parameters - Object containing the account and new threshold value.
 * @returns A Promise resolving to a Call object with the transaction data.
 *
 * @throws {AccountNotFoundError} When no account is provided and the client lacks an associated account.
 * @throws {Error} If the account parsing fails or if there's an issue generating the action data.
 *
 * @example
 * ```typescript
 * const txData = await getSetThresholdTx(client, { threshold: 2 });
 * console.log(txData); // { to: '0x...', value: 0n, data: '0x...' }
 * ```
 */
export async function getSetThresholdTx<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: GetSetThresholdTxParameters<TSmartAccount>
): Promise<Call> {
  const { account: account_ = client.account, threshold } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
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
