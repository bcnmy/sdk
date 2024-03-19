import type { Client } from "viem"
import { sponsorUserOperation } from "../../paymaster/actions/sponsorUserOperation"
import type { PaymasterClient } from "../../paymaster/createPaymasterClient"
import type {
  SponsorUserOperationParameters,
  SponsorUserOperationReturnType
} from "../../paymaster/utils/types"

export type PaymasterClientActions = {
  /**
   * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
   *
   * https://docs.stackup.sh/docs/paymaster-api-rpc-methods#pm_sponsoruseroperation
   *
   * @param args {@link SponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
   * @returns paymasterAndData & updated gas parameters, see {@link SponsorUserOperationReturnType}
   *
   * @example
   * import { createClient } from "viem"
   * import { stackupPaymasterActions } from "permissionless/actions/stackup"
   *
   * const bundlerClient = createClient({
   *      chain: goerli,
   *      transport: http("https://api.stackup.sh/v1/paymaster/YOUR_API_KEY_HERE")
   * }).extend(stackupPaymasterActions)
   *
   * await bundlerClient.sponsorUserOperation(bundlerClient, {
   *      userOperation: userOperationWithDummySignature,
   *      entryPoint: entryPoint
   * }})
   *
   */
  sponsorUserOperation: (
    args: SponsorUserOperationParameters
  ) => Promise<SponsorUserOperationReturnType>

  /**
   * Returns all the Paymaster addresses associated with an EntryPoint that’s owned by this service.
   *
   * https://docs.stackup.sh/docs/paymaster-api-rpc-methods#pm_accounts
   *
   * @param args {@link AccountsParameters} entryPoint for which you want to get list of supported paymasters.
   * @returns paymaster addresses
   *
   * @example
   * import { createClient } from "viem"
   * import { stackupPaymasterActions } from "permissionless/actions/stackup"
   *
   * const bundlerClient = createClient({
   *      chain: goerli,
   *      transport: http("https://api.stackup.sh/v1/paymaster/YOUR_API_KEY_HERE")
   * }).extend(stackupPaymasterActions)
   *
   * await bundlerClient.accounts(bundlerClient, {
   *      entryPoint: entryPoint
   * }})
   *
   */
  // accounts: (args: AccountsParameters) => Promise<Address[]>
}

export const paymasterActions =
  () =>
  (client: Client): PaymasterClientActions => ({
    sponsorUserOperation: async (args) =>
      sponsorUserOperation(client as PaymasterClient, {
        ...args
      })
    // accounts: async (args) =>
    // accounts(client as PaymasterClient, args)
  })
