import { getAddOwnableValidatorOwnerAction } from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import { sendUserOperation } from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { ModularSmartAccount } from "../../utils/Types"

/**
 * Parameters for adding an owner to a smart account.
 *
 * @template TModularSmartAccount - The type of the smart account, which can be a ModularSmartAccount or undefined.
 */
export type AddOwnerParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** The smart account to add the owner to. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
  /** The address of the new owner to be added. */
  owner: Hex
  /** The maximum fee per gas unit the transaction is willing to pay. */
  maxFeePerGas?: bigint
  /** The maximum priority fee per gas unit the transaction is willing to pay. */
  maxPriorityFeePerGas?: bigint
  /** The nonce of the transaction. If not provided, it will be determined automatically. */
  nonce?: bigint
}

/**
 * Adds a new owner to a smart account.
 *
 * This function prepares and sends a user operation to add a new owner to the specified smart account.
 * It handles the creation of the necessary action data and sends the user operation.
 *
 * @template TModularSmartAccount - The type of the smart account, which can be a ModularSmartAccount or undefined.
 * @param client - The client used to interact with the blockchain.
 * @param parameters - The parameters for adding the new owner.
 * @returns A promise that resolves to the hash of the sent user operation.
 * @throws {AccountNotFoundError} If no account is provided and the client doesn't have an associated account.
 * @throws {Error} If there's an error getting the add owner action.
 */
export async function addOwner<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters: AddOwnerParameters<TModularSmartAccount>
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

  const account = parseAccount(account_) as ModularSmartAccount
  const publicClient = account.client

  const action = await getAddOwnableValidatorOwnerAction({
    account: { address: account.address, deployedOnChains: [], type: "nexus" },
    client: publicClient as PublicClient,
    owner
  })

  if (!("callData" in action)) {
    throw new Error("Error getting add owner action")
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
