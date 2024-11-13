import type { Chain, Client, Hex, Transport } from "viem"
import { type BundlerClient, sendUserOperation } from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { ERROR_MESSAGES } from "../../../account"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { Call } from "../../../account/utils/Types"
import type { Signer } from "../../../account/utils/toSigner"
import type { DanActions } from "../../../clients/decorators/dan/decorators"
import { parseModule } from "../../utils/Helpers"
import type { ModularSmartAccount } from "../../utils/Types"
import type { SmartSessionModule } from "../toSmartSessionsValidator"

/**
 * Parameters for using a smart session to execute actions.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 */
export type UseDistributedPermissionParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** Array of executions to perform in the session. Allows for batch transactions if the session is enabled for multiple actions. */
  calls: Call[]
  /** The maximum fee per gas unit the transaction is willing to pay. */
  maxFeePerGas?: bigint
  /** The maximum priority fee per gas unit the transaction is willing to pay. */
  maxPriorityFeePerGas?: bigint
  /** The nonce of the transaction. If not provided, it will be determined automatically. */
  nonce?: bigint
  /** The modular smart account to use for the session. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
  /** The signer to use for the session. Defaults to the signer of the client. */
  signer?: Signer
}

export type DanClient = Client<
  Transport,
  Chain | undefined,
  ModularSmartAccount
> &
  DanActions<ModularSmartAccount> &
  BundlerClient

/**
 * Executes actions using a smart session.
 *
 * This function allows for the execution of one or more actions within an enabled smart session.
 * It can handle batch transactions if the session is configured for multiple actions.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 * @param client - The client used to interact with the blockchain.
 * @param parameters - Parameters for using the session, including actions to execute and optional gas settings.
 * @returns A promise that resolves to the hash of the sent user operation.
 *
 * @throws {AccountNotFoundError} If no account is provided and the client doesn't have an associated account.
 *
 * @example
 * ```typescript
 * const result = await useDistributedPermission(nexusClient, {
 *   calls: [
 *     {
 *       to: '0x1234...',
 *       data: '0xabcdef...'
 *     }
 *   ],
 *   maxFeePerGas: 1000000000n
 * });
 * console.log(`Transaction hash: ${result}`);
 * ```
 *
 * @remarks
 * - Ensure that the session is enabled and has the necessary permissions for the actions being executed.
 * - For batch transactions, all actions must be permitted within the same session.
 * - The function uses the `sendUserOperation` method, which is specific to account abstraction implementations.
 */
export async function useDistributedPermission<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: DanClient,
  parameters: UseDistributedPermissionParameters<TModularSmartAccount>
): Promise<Hex> {
  const { account: account_ = client.account } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const params = { ...parameters, account: account_ }

  const preppedUserOp = await client.prepareUserOperation(params)
  const sessionsModule = parseModule(client) as SmartSessionModule
  const keyGenData = sessionsModule?.moduleData?.keyGenData

  if (!keyGenData) {
    throw new Error(ERROR_MESSAGES.KEY_GEN_DATA_NOT_FOUND)
  }

  const { signature } = await client.sigGen({ ...preppedUserOp, keyGenData })

  if (!signature) {
    throw new Error(ERROR_MESSAGES.SIGNATURE_NOT_FOUND)
  }

  const extendedSignature = sessionsModule.sigGen(signature)

  return await getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
    // @ts-ignore
  )({ ...preppedUserOp, account: account_, signature: extendedSignature })
}
