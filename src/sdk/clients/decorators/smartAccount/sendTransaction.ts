import {
  type Address,
  type Chain,
  type Client,
  type Hash,
  type PublicClient,
  type SendTransactionParameters,
  type Transport,
  erc20Abi,
  maxUint256
} from "viem"
import {
  type SendUserOperationParameters,
  type SmartAccount,
  sendUserOperation,
  waitForUserOperationReceipt
} from "viem/account-abstraction"
import { encodeFunctionData, getAction, parseAccount } from "viem/utils"
import {
  BICONOMY_TOKEN_PAYMASTER,
  getAllowance,
  isBundlerClient
} from "../../../account"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"

/**
 * Creates, signs, and sends a new transaction to the network using a smart account.
 * This function also allows you to sponsor this transaction if the sender is a smart account.
 *
 * @param client - The client instance.
 * @param args - Parameters for sending the transaction or user operation.
 * @param customApprovalAmount - The amount to approve for the fee token to the Biconomy Token.
 * @returns The transaction hash as a hexadecimal string.
 * @throws {AccountNotFoundError} If the account is not found.
 *
 * @example
 * import { sendTransaction } from '@biconomy/sdk'
 *
 * const hash = await sendTransaction(nexusClient, {
 *   to: '0x...',
 *   value: parseEther('0.1'),
 *   data: '0x...'
 * })
 * console.log(hash) // '0x...'
 */
export async function sendTransaction<
  account extends SmartAccount | undefined,
  chain extends Chain | undefined,
  accountOverride extends SmartAccount | undefined = undefined,
  chainOverride extends Chain | undefined = Chain | undefined,
  calls extends readonly unknown[] = readonly unknown[]
>(
  client: Client<Transport, chain, account>,
  args:
    | SendTransactionParameters<chain, account, chainOverride>
    | SendUserOperationParameters<account, accountOverride, calls>,
  customApprovalAmount?: bigint
): Promise<Hash> {
  if (!isBundlerClient(client)) {
    throw new Error("Client must be a NexusClient instance")
  }

  let userOpHash: Hash

  let gasTokenAllowance = 0n
  if (client.paymasterContext?.mode === "ERC20") {
    gasTokenAllowance = await getAllowance(
      client.account?.client as PublicClient,
      client.account?.address as Address,
      client.paymasterContext?.tokenInfo.feeTokenAddress as Address
    )
  }

  if ("to" in args) {
    const {
      account: account_ = client.account,
      data,
      maxFeePerGas,
      maxPriorityFeePerGas,
      to,
      value,
      nonce
    } = args

    if (!account_) {
      throw new AccountNotFoundError({
        docsPath: "/nexus-client/methods#sendtransaction"
      })
    }

    const account = parseAccount(account_) as SmartAccount

    if (!to) throw new Error("Missing to address")

    userOpHash = await getAction(
      client,
      sendUserOperation,
      "sendUserOperation"
    )({
      calls:
        client.paymasterContext?.mode === "ERC20" &&
        (gasTokenAllowance <= 0 || customApprovalAmount)
          ? [
              {
                to: client.paymasterContext?.tokenInfo.feeTokenAddress ?? null,
                data: encodeFunctionData({
                  functionName: "approve",
                  abi: erc20Abi,
                  args: [
                    BICONOMY_TOKEN_PAYMASTER,
                    customApprovalAmount ?? maxUint256
                  ]
                }),
                value: BigInt(0)
              },
              {
                to,
                value: value || BigInt(0),
                data: data || "0x"
              }
            ].filter(Boolean)
          : [
              {
                to,
                value: value || BigInt(0),
                data: data || "0x"
              }
            ].filter(Boolean),
      account,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce: nonce ? BigInt(nonce) : undefined
    })
  } else {
    userOpHash = await getAction(
      client,
      sendUserOperation,
      "sendUserOperation"
    )({
      ...args,
      calls:
        client.paymasterContext?.mode === "ERC20" &&
        (gasTokenAllowance <= 0 || customApprovalAmount)
          ? [
              {
                to: client.paymasterContext?.tokenInfo.feeTokenAddress ?? null,
                data: encodeFunctionData({
                  functionName: "approve",
                  abi: erc20Abi,
                  args: [
                    BICONOMY_TOKEN_PAYMASTER,
                    customApprovalAmount ?? maxUint256
                  ]
                }),
                value: BigInt(0)
              },
              // @ts-ignore
              ...args.calls
              // @ts-ignore
            ]
          : // @ts-ignore
            [...args.calls]
    } as SendUserOperationParameters<account, accountOverride>)
  }

  const userOperationReceipt = await getAction(
    client,
    waitForUserOperationReceipt,
    "waitForUserOperationReceipt"
  )({
    hash: userOpHash
  })

  return userOperationReceipt?.receipt.transactionHash
}
