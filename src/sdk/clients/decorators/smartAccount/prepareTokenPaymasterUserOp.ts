import {
  type Address,
  type Chain,
  type Client,
  type Transport,
  erc20Abi,
  maxUint256
} from "viem"
import { encodeFunctionData } from "viem"
import type { SmartAccount, UserOperation } from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { BICONOMY_TOKEN_PAYMASTER } from "../../../account/utils/Constants"
import { prepareUserOperationWithoutSignature } from "./prepareUserOperationWithoutSignature"

export type Transaction = {
  to: Address
  data: `0x${string}`
  value: bigint
}

/**
 * Parameters for preparing a token paymaster user operation
 */
export type PrepareTokenPaymasterUserOpParameters = {
  /** Array of transactions to be executed */
  calls: Transaction[]
  /** Token used for paying for the gas */
  feeTokenAddress: Address
  /** Optional custom approval amount for the token paymaster. If not provided, max uint256 will be used */
  customApprovalAmount?: bigint
}

/**
 * Prepares a user operation with token paymaster configuration, including ERC20 token approval 
 * 
 * This function handles:
 * 1. Checking current token allowance of Smart Account
 * 2. Creating an approval transaction for the token paymaster if needed
 * 3. Preparing the user operation with the approval and user transactions
 * 
 * @param client - The NexusClient instance
 * @param args.txs - Array of transactions to be executed
 * @param args.feeTokenAddress - Token used for paying for the gas
 * @param args.customApprovalAmount - Optional custom approval amount 
 * 
 * @returns A prepared user operation without signature (will be signed by the Smart Account when sent)
 * 
 * @example
 * ```typescript
 * const userOp = await prepareTokenPaymasterUserOp(nexusClient, {
 *    txs: [
 *      {
 *        to: recipientAddress,
 *        value: 1n,
 *        data: "0x"
        }
      ],
      customApprovalAmount: usdcFeeAmount
    })
 * ```
 * 
 * @throws Will throw an error if client account or paymaster context is not properly configured
 */
export async function prepareTokenPaymasterUserOp<
  account extends SmartAccount | undefined,
  chain extends Chain | undefined
>(
  client: Client<Transport, chain, account>,
  args: PrepareTokenPaymasterUserOpParameters
): Promise<Omit<UserOperation<"0.7">, "signature">> {
  const { calls, customApprovalAmount, feeTokenAddress } = args

  const userOp = await getAction(
    client,
    prepareUserOperationWithoutSignature,
    "prepareUserOperation"
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
    account: client.account as SmartAccount
  })

  const partialUserOp = {
    ...userOp,
    signature: undefined
  }

  return partialUserOp
}
