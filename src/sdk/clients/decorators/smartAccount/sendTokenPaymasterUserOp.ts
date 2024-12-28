import type { Chain, Hash, Transport } from "viem"
import type { Client } from "viem"
import { maxUint256 } from "viem"
import { erc20Abi } from "viem"
import { type Address, encodeFunctionData } from "viem"
import { type SmartAccount, sendUserOperation } from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { BICONOMY_TOKEN_PAYMASTER } from "../../../account/utils/Constants"
import {
  type Transaction,
  prepareTokenPaymasterUserOp
} from "./prepareTokenPaymasterUserOp"

export type SendTokenPaymasterUserOpParameters = {
  calls: Transaction[]
  feeTokenAddress: Address
  customApprovalAmount?: bigint
}

/**
 * Prepares and sends a user operation with token paymaster
 *
 * @param client - The Nexus client instance
 * @param args - The parameters for the token paymaster user operation
 * @param args.calls - Array of transactions to be executed
 * @param args.feeTokenAddress - Address of the token to be used for paying gas fees
 * @param args.customApprovalAmount - Optional custom amount to approve for the paymaster (defaults to unlimited)
 *
 * @example
 * ```ts
 * const hash = await sendTokenPaymasterUserOp(client, {
 *   calls: [{
 *     to: "0x...", // Contract address
 *     data: "0x...", // Encoded function data
 *     value: BigInt(0)
 *   }],
 *   feeTokenAddress: "0x...", // USDC/USDT/etc address
 *   customApprovalAmount: BigInt(1000) // Optional: specific approval amount
 * })
 * ```
 *
 * @returns A promise that resolves to the user operation hash {@link Hash}
 */
export async function sendTokenPaymasterUserOp<
  TChain extends Chain | undefined = Chain | undefined,
  TSmartAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
  client: Client<Transport, TChain, TSmartAccount>,
  args: SendTokenPaymasterUserOpParameters
): Promise<Hash> {
  const { calls, feeTokenAddress, customApprovalAmount } = args

  const userOp = await getAction(
    client,
    prepareTokenPaymasterUserOp,
    "prepareTokenPaymasterUserOperation"
  )({
    calls: [
      {
        to: feeTokenAddress,
        data: encodeFunctionData({
          functionName: "approve",
          abi: erc20Abi,
          args: [BICONOMY_TOKEN_PAYMASTER, customApprovalAmount ?? maxUint256]
        }),
        value: BigInt(0)
      },
      ...calls
    ],
    feeTokenAddress,
    customApprovalAmount
  })

  const partialUserOp = {
    ...userOp,
    signature: undefined
  }

  const userOpHash = await getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
  )(partialUserOp)

  return userOpHash
}
