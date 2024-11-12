import { getSetOwnableValidatorThresholdAction } from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, Transport } from "viem"
import { sendUserOperation } from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { ModularSmartAccount } from "../../utils/Types"

/**
 * Parameters for setting the threshold of a modular smart account.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 */
export type SetThresholdParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** The modular smart account to set the threshold for. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
  /** The new threshold value to set. Determines the number of required signatures for transactions. */
  threshold: number
  /** The maximum fee per gas unit the transaction is willing to pay. */
  maxFeePerGas?: bigint
  /** The maximum priority fee per gas unit the transaction is willing to pay. */
  maxPriorityFeePerGas?: bigint
  /** The nonce of the transaction. If not provided, it will be determined automatically. */
  nonce?: bigint
}

/**
 * Sets a new threshold for a modular smart account.
 *
 * This function prepares and sends a user operation to change the threshold of the specified modular smart account.
 * The threshold determines how many owners need to approve a transaction before it can be executed.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 * @param client - The client used to interact with the blockchain.
 * @param parameters - The parameters for setting the new threshold.
 * @returns A promise that resolves to the hash of the sent user operation.
 *
 * @throws {AccountNotFoundError} If no account is provided and the client doesn't have an associated account.
 *
 * @example
 * ```typescript
 * const nexusClient = createNexusClient({ ... });
 * const hash = await setThreshold(nexusClient, {
 *   threshold: 2,
 *   maxFeePerGas: 1000000000n
 * });
 * console.log(`Set threshold transaction hash: ${hash}`);
 * ```
 *
 * @remarks
 * - Ensure that the new threshold is valid for the current number of owners in the account.
 * - This operation will modify the state of the smart account on the blockchain.
 * - The transaction may fail if the caller doesn't have the necessary permissions to change the threshold.
 */
export async function setThreshold<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters: SetThresholdParameters<TModularSmartAccount>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    threshold
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as ModularSmartAccount

  const action = getSetOwnableValidatorThresholdAction({ threshold })

  return getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
  )({
    calls: [
      {
        to: action.target,
        value: BigInt(action.value.toString()),
        data: action.callData
      }
    ],
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    account
  })
}
