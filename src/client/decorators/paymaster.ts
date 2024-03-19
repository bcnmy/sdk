import type { Client } from "viem"
import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "../../accounts/utils/types"
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
    args: Omit<SponsorUserOperationParameters, "entrypoint">
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
  <entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE>(
    entryPointAddress: entryPoint
  ) =>
  (client: Client): PaymasterClientActions => ({
    sponsorUserOperation: async (args) =>
      sponsorUserOperation(client as PaymasterClient, {
        ...args,
        entryPoint: entryPointAddress
      })
    // accounts: async (args) =>
    // accounts(client as PaymasterClient, args)
  })
