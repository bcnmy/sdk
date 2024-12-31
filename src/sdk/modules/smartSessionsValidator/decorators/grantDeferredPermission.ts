import type { Chain, Client, PublicClient, Transport } from "viem"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import {
  MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS,
  SmartSessionMode,
  getAccount,
  getEnableSessionDetails
} from "../../../constants"
import type { ModularSmartAccount } from "../../utils/Types"
import type { CreateSessionDataParams, SessionData } from "../Types"
import { preparePermission } from "./preparePermission"

/**
 * Parameters for creating sessions in a modular smart account.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 */
export type GrantDeferredPermissionParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** Array of session data parameters for creating multiple sessions. */
  sessionRequestedInfo: CreateSessionDataParams[]
  /** Optional public client for blockchain interactions. */
  publicClient?: PublicClient
  /** The modular smart account to create sessions for. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
}

export type GrantDeferredPermissionResponse = SessionData["moduleData"]
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
 * import { grantDeferredPermission } from '@biconomy/sdk'
 *
 * const result = await grantDeferredPermission(nexusClient, {
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
export async function grantDeferredPermission<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters: GrantDeferredPermissionParameters<TModularSmartAccount>
): Promise<GrantDeferredPermissionResponse> {
  const { account: account_ = client.account } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as ModularSmartAccount
  const publicClient = account?.client as PublicClient

  if (!account || !account.address) {
    throw new Error("Account not found")
  }

  const preparedPermission = await getAction(
    client,
    preparePermission,
    "preparePermission"
  )(parameters)

  const nexusAccount = getAccount({
    address: account.address,
    type: "nexus"
  })

  const sessionDetailsWithPermissionEnableHash = await getEnableSessionDetails({
    enableMode: SmartSessionMode.UNSAFE_ENABLE,
    sessions: preparedPermission.sessions,
    account: nexusAccount,
    clients: [publicClient],
    enableValidatorAddress: MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS
  })

  const { permissionEnableHash, ...sessionDetails } =
    sessionDetailsWithPermissionEnableHash

  sessionDetails.enableSessionData.enableSession.permissionEnableSig =
    await account.signer.signMessage({ message: { raw: permissionEnableHash } })

  return {
    permissionIds: preparedPermission.permissionIds,
    action: preparedPermission.action,
    mode: SmartSessionMode.UNSAFE_ENABLE,
    sessions: preparedPermission.sessions,
    enableSessionData: sessionDetails.enableSessionData
  }
}
