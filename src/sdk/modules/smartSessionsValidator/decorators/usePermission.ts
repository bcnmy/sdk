import type { Chain, Client, Hex, Transport } from "viem"
import {
  PrepareUserOperationParameters,
  type SendUserOperationParameters,
  prepareUserOperation,
  sendUserOperation
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { type KeyGenData, sigGen } from "../../../account/toDanAccount"
import type { NexusAccount } from "../../../account/toNexusAccount"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { Signer } from "../../../account/utils/toSigner"
import type { Execution, ModularSmartAccount } from "../../utils/Types"

/**
 * Parameters for using a smart session to execute actions.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 */
export type UsePermissionParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** Array of executions to perform in the session. Allows for batch transactions if the session is enabled for multiple actions. */
  actions: Execution[]
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
  /** Key generation data for DAN accounts */
  keyGenData?: KeyGenData
}

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
 * const result = await usePermission(nexusClient, {
 *   actions: [
 *     {
 *       target: '0x1234...',
 *       value: 0n,
 *       callData: '0xabcdef...'
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
export async function usePermission<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters: UsePermissionParameters<TModularSmartAccount>
): Promise<Hex> {
  const { account: account_ = client.account, actions, keyGenData } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as NexusAccount

  const sendUserOperationArgs: SendUserOperationParameters = {
    calls: actions.map((action) => ({
      to: action.target,
      value: BigInt(action.value.toString()),
      data: action.callData
    }))
  }

  if (keyGenData) {
    sendUserOperationArgs.signature = await sigGen(client, {
      keyGenData,
      ...sendUserOperationArgs
    })

    console.log("sendUserOperationArgs", { sendUserOperationArgs })
  }

  return await getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
  )(sendUserOperationArgs)
}
