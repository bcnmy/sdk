import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import { sendUserOperation } from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { ModularSmartAccount } from "../../utils/Types"
import type {
  CreateSessionDataParams,
  GrantPermissionAdvancedResponse
} from "../Types"
import { preparePermission } from "./preparePermission"

/**
 * Parameters for creating sessions in a modular smart account.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 */
export type GrantPermissionAdvancedParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** Array of session data parameters for creating multiple sessions. */
  sessionRequestedInfo: CreateSessionDataParams[]
  /** The maximum fee per gas unit the transaction is willing to pay. */
  maxFeePerGas?: bigint
  /** The maximum priority fee per gas unit the transaction is willing to pay. */
  maxPriorityFeePerGas?: bigint
  /** The nonce of the transaction. If not provided, it will be determined automatically. */
  nonce?: bigint
  /** Optional public client for blockchain interactions. */
  publicClient?: PublicClient
  /** The modular smart account to create sessions for. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
  /** Optional attesters to trust. */
  attesters?: Hex[]
}

/**
 * Adds multiple sessions to the SmartSessionValidator module of a given smart account.
 *
 * This function prepares and sends a user operation to create multiple sessions
 * for the specified modular smart account. Each session can have its own policies
 * and permissions.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 * @param client - The client used to interact with the blockchain.
 * @param parameters - Parameters including the smart account, required session specific policies info, and optional gas settings.
 * @returns A promise that resolves to an object containing the user operation hash and an array of permission IDs.
 *
 * @throws {AccountNotFoundError} If the account is not found.
 * @throws {Error} If there's an error getting the enable sessions action.
 *
 * @example
 * ```typescript
 * import { grantPermissionAdvanced } from '@biconomy/sdk'
 *
 * const result = await grantPermissionAdvanced(nexusClient, {
 *   sessionRequestedInfo: [
 *     {
 *       sessionKeyData: '0x...',
 *       actionPoliciesInfo: [
 *         {
 *           contractAddress: '0x...',
 *           functionSelector: '0x...',
 *           rules: [...],
 *           valueLimit: 1000000000000000000n
 *         }
 *       ],
 *       sessionValidUntil: 1234567890
 *     }
 *   ]
 * });
 * console.log(result.userOpHash); // '0x...'
 * console.log(result.permissionIds); // ['0x...', '0x...']
 * ```
 *
 * @remarks
 * - Ensure that the client has sufficient gas to cover the transaction.
 * - The number of sessions created is determined by the length of the `sessionRequestedInfo` array.
 * - Each session's policies and permissions are determined by the `actionPoliciesInfo` provided.
 */
export async function grantPermissionAdvanced<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters: GrantPermissionAdvancedParameters<TModularSmartAccount>
): Promise<GrantPermissionAdvancedResponse> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as ModularSmartAccount
  if (!account || !account.address) {
    throw new Error("Account not found")
  }

  const preparedPermission = await getAction(
    client,
    preparePermission,
    "preparePermission"
  )(parameters)

  const userOpHash = await getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
  )({
    calls: preparedPermission.calls,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    account
  })

  return {
    userOpHash,
    ...preparedPermission
  }
}
