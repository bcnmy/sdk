import { getAddOwnableValidatorOwnerAction } from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, Transport } from "viem"
import {
  type GetSmartAccountParameter,
  type SmartAccount,
  sendUserOperation
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../../../account/utils/AccountNotFound"

export type AddOwnerParameters<TSmartAccount extends SmartAccount | undefined> =
  GetSmartAccountParameter<TSmartAccount> & {
    owner: Hex
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
    signatureOverride?: Hex
  }

/**
 * Adds an owner to the OwnableValidator module of a given smart account.
 *
 * @param client - The client instance.
 * @param parameters - Parameters including the smart account, new owner address, and optional gas settings.
 * @returns The hash of the user operation as a hexadecimal string.
 * @throws {AccountNotFoundError} If the account is not found.
 *
 * @example
 * import { addOwner } from '@biconomy/sdk'
 *
 * const userOpHash = await addOwner(nexusClient, {
 *   owner: '0x...'
 * })
 * console.log(userOpHash) // '0x...'
 */
export async function addOwner<TSmartAccount extends SmartAccount | undefined>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: AddOwnerParameters<TSmartAccount>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    owner,
    signatureOverride
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/docs/actions/wallet/sendTransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount
  const publicClient = account.client

  const action = await getAddOwnableValidatorOwnerAction({
    account: { address: account.address, deployedOnChains: [], type: "nexus" },
    client: publicClient as any,
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
    account,
    signature: signatureOverride
  })
}
