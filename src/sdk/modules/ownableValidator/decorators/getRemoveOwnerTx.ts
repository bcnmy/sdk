import { getRemoveOwnableValidatorOwnerAction } from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import type { ModularSmartAccount } from "../../utils/Types"

import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { Call } from "../../../account/utils/Types"

/**
 * Parameters for getting the transaction to remove an owner from a smart account.
 *
 * @template TModularSmartAccount - The type of the smart account, which can be a ModularSmartAccount or undefined.
 */
export type GetRemoveOwnerTxParameters<TModularSmartAccount> = {
  /** The smart account to remove the owner from. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
  /** The address of the owner to be removed. */
  owner: Hex
}

/**
 * Generates the transaction data for removing an owner from a smart account.
 *
 * This function prepares the necessary transaction data to remove an owner from the specified smart account.
 * It doesn't send the transaction, but returns the data needed to do so.
 *
 * @template TModularSmartAccount - The type of the smart account, which can be a ModularSmartAccount or undefined.
 * @param client - The client used to interact with the blockchain.
 * @param parameters - The parameters for removing the owner.
 * @returns A promise that resolves to a Call object containing the transaction data.
 * @throws {AccountNotFoundError} If no account is provided and the client doesn't have an associated account.
 * @throws {Error} If there's an error getting the remove owner action or if the public client is not found.
 */
export async function getRemoveOwnerTx<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters: GetRemoveOwnerTxParameters<TModularSmartAccount>
): Promise<Call> {
  const { account: account_ = client.account, owner } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as ModularSmartAccount
  const publicClient = account.client

  if (!publicClient) {
    throw new Error("Public client not found")
  }

  const action = await getRemoveOwnableValidatorOwnerAction({
    account: { address: account.address, deployedOnChains: [], type: "nexus" },
    client: publicClient as PublicClient,
    owner
  })

  if (!("callData" in action)) {
    throw new Error("Error getting remove owner action")
  }

  return {
    to: action.target,
    value: BigInt(action.value.toString()),
    data: action.callData
  }
}
