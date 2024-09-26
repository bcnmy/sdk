import { getSetOwnableValidatorThresholdAction } from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, Transport } from "viem"
import {
  type GetSmartAccountParameter,
  type SmartAccount,
  sendUserOperation
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../../account/utils/AccountNotFound"

export type SetThresholdParameters<
  TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
  threshold: number
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: bigint
  signatureOverride?: Hex
}

/**
 * Sets the threshold for the OwnableValidator module of a given smart account.
 *
 * @param client - The client instance.
 * @param parameters - Parameters including the smart account, new threshold, and optional gas settings.
 * @returns The hash of the user operation as a hexadecimal string.
 * @throws {AccountNotFoundError} If the account is not found.
 *
 * @example
 * import { setThreshold } from '@biconomy/sdk'
 *
 * const userOpHash = await setThreshold(nexusClient, {
 *   threshold: 2
 * })
 * console.log(userOpHash) // '0x...'
 */
export async function setThreshold<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: SetThresholdParameters<TSmartAccount>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    threshold,
    signatureOverride
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/docs/actions/wallet/sendTransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount

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
    account,
    signature: signatureOverride
  })
}
