import { getRemoveOwnableValidatorOwnerAction } from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import { type SmartAccount, sendUserOperation } from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { ModularSmartAccount } from "../../utils/Types"

/**
 * Parameters for removing an owner from a smart account.
 *
 * @template TModularSmartAccount - Type of the smart account, extending SmartAccount or undefined.
 */
export type RemoveOwnerParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** The smart account to remove the owner from. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
  /** The address of the owner to be removed. */
  owner: Hex
  /** The maximum fee per gas unit the transaction is willing to pay. */
  maxFeePerGas?: bigint
  /** The maximum priority fee per gas unit the transaction is willing to pay. */
  maxPriorityFeePerGas?: bigint
  /** The nonce of the transaction. If not provided, it will be determined automatically. */
  nonce?: bigint
}

/**
 * Removes an owner from a smart account.
 *
 * This function prepares and sends a user operation to remove an existing owner from the specified smart account.
 * It handles the creation of the necessary action data and sends the user operation.
 *
 * @template TModularSmartAccount - Type of the smart account, extending SmartAccount or undefined.
 * @param client - The client used to interact with the blockchain.
 * @param parameters - The parameters for removing the owner.
 * @returns A promise that resolves to the hash of the sent user operation.
 *
 * @throws {AccountNotFoundError} If no account is provide
 * @throws {Error} If there's an error getting the remove owner action.
 *
 * @example
 * ```typescript
 * import { removeOwner } from '@biconomy/sdk'
 *
 * const userOpHash = await removeOwner(nexusClient, {
 *   owner: '0x...'
 * })
 * console.log(userOpHash) // '0x...'
 * ```
 */
export async function removeOwner<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters: RemoveOwnerParameters<TModularSmartAccount>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    owner
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount
  const publicClient = account.client

  const action = await getRemoveOwnableValidatorOwnerAction({
    account: { address: account.address, deployedOnChains: [], type: "nexus" },
    client: publicClient as PublicClient,
    owner
  })

  if (!("callData" in action)) {
    throw new Error("Error getting remove owner action")
  }

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
