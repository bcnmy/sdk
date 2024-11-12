import {
  getAccount,
  getOwnableValidatorThreshold
} from "@rhinestone/module-sdk"
import type { Chain, Client, PublicClient, Transport } from "viem"
import type { GetSmartAccountParameter } from "viem/account-abstraction"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { ModularSmartAccount } from "../../utils/Types"

/**
 * Parameters for retrieving the threshold of a modular smart account.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 */
export type GetThresholdParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = GetSmartAccountParameter<TModularSmartAccount>

/**
 * Retrieves the current approval threshold for a modular smart account.
 *
 * In the context of multi-signature wallets or modular smart accounts, the threshold
 * represents the minimum number of approvals required to execute a transaction.
 * This function queries the blockchain to fetch the current threshold value.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 *
 * @param client - The client instance used for blockchain interactions.
 * @param parameters - Optional. Specifies the account to query. If omitted, the client's default account is used.
 *
 * @returns A Promise that resolves to the current threshold value as a number.
 *
 * @throws {AccountNotFoundError} If no account is specified and the client has no default account.
 * @throws {Error} If the public client is not available or if there's an issue fetching the threshold.
 *
 * @example
 * ```typescript
 * const nexusClient = createNexusClient({ ... });
 * const threshold = await getThreshold(nexusClient);
 * console.log(`Current approval threshold: ${threshold}`);
 * ```
 *
 * @remarks
 * - Ensure the client is properly initialized and connected to the correct network.
 * - The threshold value is specific to the queried account and may vary between different accounts.
 * - This function is read-only and does not modify the blockchain state.
 */
export async function getThreshold<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters?: GetThresholdParameters<TModularSmartAccount>
): Promise<number> {
  const { account: account_ = client.account } = parameters ?? {}

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as ModularSmartAccount
  const publicClient = account?.client as PublicClient

  if (!publicClient) {
    throw new Error("Public client not found")
  }

  const nexusAccount = getAccount({
    address: account.address,
    type: "nexus"
  })

  return await getOwnableValidatorThreshold({
    account: nexusAccount,
    client: publicClient as PublicClient
  })
}
