import type { Chain, Client, Hash, Transport } from "viem"
import {
  type SmartAccount,
  sendUserOperation,
  waitForUserOperationReceipt
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { ENTRY_POINT_ADDRESS } from "../../../../constants"
import { type SigGenParameters, sigGen } from "./sigGen"

/**
 * Sends a transaction using Account Abstraction (ERC-4337) through DAN.
 * Handles the full lifecycle of a user operation from signature generation to transaction confirmation.
 *
 * @param client - The viem Client instance configured with transport, chain, and account
 * @param parameters - Parameters required for signature generation and transaction execution
 * @returns A Promise resolving to the transaction hash
 *
 * @throws Will throw if signature generation fails
 * @throws Will throw if sending user operation fails
 * @throws Will throw if waiting for receipt fails
 *
 * @example
 * const hash = await sendTx(client, {
 *   keyGenData: { key: '0x...', signature: '0x...' },
 *   calls: [{ to: '0x...', value: 1n }]
 * })
 */
export async function sendTx<
  account extends SmartAccount | undefined,
  chain extends Chain | undefined
>(
  client: Client<Transport, chain, account>,
  parameters: SigGenParameters
): Promise<Hash> {
  const { userOperation, signature } = await getAction(
    client,
    sigGen,
    "sigGen"
  )(parameters)

  const userOpHash = await client.request(
    {
      method: "eth_sendUserOperation",
      params: [{ ...userOperation, signature }, ENTRY_POINT_ADDRESS]
    },
    { retryCount: 0 }
  )

  const userOperationReceipt = await getAction(
    client,
    waitForUserOperationReceipt,
    "waitForUserOperationReceipt"
  )({
    hash: userOpHash
  })

  return userOperationReceipt?.receipt.transactionHash
}
