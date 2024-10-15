import type { Chain, Client, Hex, Transport } from "viem"
import { type SmartAccount, sendUserOperation } from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import type { NexusAccount } from "../../../account"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { Execution } from "../../utils/Types"
import type { UseSessionModuleData } from "../Types"

// If the session is enabled for multiple actions, it is possible to send a batch transaction. hence it accepts an array of executions.
// permisisonId corresponds to already enabled session.
export type UseSessionParameters<
  TSmartAccount extends SmartAccount | undefined
> = {
  actions: Execution[]
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: bigint
  data?: UseSessionModuleData
  account?: TSmartAccount
}

/**
 * use a particular session that is enabled already on smart session validator.
 *
 * @param client - The client instance.
 * @param parameters - Parameters including the smart account, required session specific info, and optional gas settings.
 * @returns The hash of the user operation as a hexadecimal string.
 * @throws {AccountNotFoundError} If the account is not found.
 *
 * @example
 * import { useSession } from '@biconomy/sdk'
 *
 * const userOpHash = await useSession(nexusClient, {
 *   actions: [{
 *     target: '0x...',
 *     value: BigInt(0),
 *     callData: '0x...'
 *   }],
 *   permissionId: '0x...',
 *   signatureOverride: '0x...'
 * })
 * console.log(userOpHash) // '0x...'
 */
export async function useSession<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: UseSessionParameters<TSmartAccount>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    actions
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as NexusAccount

  return await getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
  )({
    calls: actions.map((action) => ({
      to: action.target,
      value: BigInt(action.value.toString()),
      data: action.callData
    })),
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    account
  })
}