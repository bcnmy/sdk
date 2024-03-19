import type { Account, Chain, Client, Hash, Transport } from "viem"
import type { Prettify } from "viem/chains"
import type { UserOperationStruct } from "../../accounts"
import { ENTRYPOINT_ADDRESS_V06 } from "../../accounts/utils/constants"
import { deepHexlify } from "../../paymaster/utils/helpers"
import type {
  BundlerRpcSchema,
  UserOperationWithBigIntAsHex
} from "../utils/types"

export type SendUserOperationParameters = {
  userOperation: UserOperationStruct
}

/**
 * Sends user operation to the bundler
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/sendUserOperation
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link SendUserOperationParameters}.
 * @returns UserOpHash that you can use to track user operation as {@link Hash}.
 *
 * @example
 * import { createClient } from "viem"
 * import { sendUserOperation } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * const userOpHash = sendUserOperation(bundlerClient, {
 *      userOperation: signedUserOperation,
 *      entryPoint: entryPoint
 * })
 *
 * // Return '0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34'
 */
export const sendUserOperation = async <
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined
>(
  client: Client<TTransport, TChain, TAccount, BundlerRpcSchema>,
  args: Prettify<SendUserOperationParameters>
): Promise<Hash> => {
  const { userOperation } = args

  try {
    const userOperationHash = await client.request({
      method: "eth_sendUserOperation",
      params: [
        deepHexlify(userOperation) as UserOperationWithBigIntAsHex,
        ENTRYPOINT_ADDRESS_V06
      ]
    })

    return userOperationHash
  } catch (err) {
    throw new Error(`Error sending user operation. ${err}`)
  }
}