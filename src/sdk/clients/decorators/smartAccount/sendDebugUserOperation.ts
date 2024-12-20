import type {
  Address,
  Assign,
  BaseError,
  Chain,
  Client,
  Hex,
  MaybeRequired,
  Narrow,
  OneOf,
  Transport
} from "viem"
import {
  type DeriveEntryPointVersion,
  type DeriveSmartAccount,
  type EntryPointVersion,
  type FormatUserOperationRequestErrorType,
  type GetSmartAccountParameter,
  type PaymasterActions,
  type PrepareUserOperationErrorType,
  type PrepareUserOperationParameters,
  type SmartAccount,
  type UserOperation,
  type UserOperationCalls,
  type UserOperationRequest,
  formatUserOperationRequest,
  getUserOperationError,
  prepareUserOperation
} from "viem/account-abstraction"
import { parseAccount } from "viem/accounts"
import { type RequestErrorType, getAction } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { generateRandomHex } from "../../../modules/utils/Uid"

export type SendDebugUserOperationParameters<
  account extends SmartAccount | undefined = SmartAccount | undefined,
  accountOverride extends SmartAccount | undefined = SmartAccount | undefined,
  calls extends readonly unknown[] = readonly unknown[],
  //
  _derivedAccount extends SmartAccount | undefined = DeriveSmartAccount<
    account,
    accountOverride
  >,
  _derivedVersion extends
    EntryPointVersion = DeriveEntryPointVersion<_derivedAccount>
> = GetSmartAccountParameter<account, accountOverride, false> &
  (
    | UserOperation // Accept a full-formed User Operation.
    | Assign<
        // Accept a partially-formed User Operation (UserOperationRequest) to be filled.
        UserOperationRequest<_derivedVersion>,
        OneOf<
          { calls: UserOperationCalls<Narrow<calls>> } | { callData: Hex }
        > & {
          paymaster?:
            | Address
            | true
            | {
                /** Retrieves paymaster-related User Operation properties to be used for sending the User Operation. */
                getPaymasterData?:
                  | PaymasterActions["getPaymasterData"]
                  | undefined
                /** Retrieves paymaster-related User Operation properties to be used for gas estimation. */
                getPaymasterStubData?:
                  | PaymasterActions["getPaymasterStubData"]
                  | undefined
              }
            | undefined
          /** Paymaster context to pass to `getPaymasterData` and `getPaymasterStubData` calls. */
          paymasterContext?: unknown | undefined
        }
      >
  ) &
  // Allow the EntryPoint address to be overridden, if no Account is provided, it will need to be required.
  MaybeRequired<
    { entryPointAddress?: Address },
    _derivedAccount extends undefined ? true : false
  >
export type SendDebugUserOperationReturnType = Hex

export type SendDebugUserOperationErrorType =
  | FormatUserOperationRequestErrorType
  | PrepareUserOperationErrorType
  | RequestErrorType

/**
 * Broadcasts a User Operation to the Bundler.
 *
 * - Docs: https://viem.sh/actions/bundler/sendDebugUserOperation
 *
 * @param client - Client to use
 * @param parameters - {@link SendDebugUserOperationParameters}
 * @returns The User Operation hash. {@link SendDebugUserOperationReturnType}
 *
 * @example
 * import { createBundlerClient, http, parseEther } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { toSmartAccount } from 'viem/accounts'
 * import { sendDebugUserOperation } from 'viem/actions'
 *
 * const account = await toSmartAccount({ ... })
 *
 * const bundlerClient = createBundlerClient({
 *   chain: mainnet,
 *   transport: http(),
 * })
 *
 * const values = await sendDebugUserOperation(bundlerClient, {
 *   account,
 *   calls: [{ to: '0x...', value: parseEther('1') }],
 * })
 */
export async function sendDebugUserOperation<
  const calls extends readonly unknown[],
  account extends SmartAccount | undefined,
  accountOverride extends SmartAccount | undefined = undefined
>(
  client: Client<Transport, Chain | undefined, account>,
  parameters: SendDebugUserOperationParameters<account, accountOverride, calls>
) {
  const { account: account_ = client.account, entryPointAddress } = parameters

  if (!account_ && !parameters.sender) throw new AccountNotFoundError()
  const account = account_ ? parseAccount(account_) : undefined

  const request = account
    ? await getAction(
        client,
        prepareUserOperation,
        "prepareUserOperation"
      )(parameters as unknown as PrepareUserOperationParameters)
    : parameters

  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const signature = (parameters.signature ||
    (await account?.signUserOperation(request as UserOperation)))!

  const rpcParameters = formatUserOperationRequest({
    ...request,
    signature
  } as UserOperation)

  console.log("Sending User Operation:", rpcParameters)

  // Create Tenderly debug URL
  const tenderlyUrl = new URL(
    "https://dashboard.tenderly.co/JoeBico/biconomy/simulator/new"
  )
  const formattedRpcParams = {
    callData: rpcParameters.callData,
    callGasLimit: rpcParameters.callGasLimit,
    maxFeePerGas: rpcParameters.maxFeePerGas,
    maxPriorityFeePerGas: rpcParameters.maxPriorityFeePerGas,
    nonce: rpcParameters.nonce,
    paymasterPostOpGasLimit: rpcParameters.paymasterPostOpGasLimit,
    paymasterVerificationGasLimit: rpcParameters.paymasterVerificationGasLimit,
    preVerificationGas: rpcParameters.preVerificationGas,
    sender: rpcParameters.sender,
    signature: rpcParameters.signature,
    verificationGasLimit: rpcParameters.verificationGasLimit
  }

  const params = new URLSearchParams({
    contractAddress: "0x0000000071727de22e5e9d8baf0edac6f37da032",
    value: "0",
    network: "84532",
    // simulationId: generateRandomHex(),
    contractFunction: "0x765e827f",
    rawFunctionInput: rpcParameters.callData,
    functionInputs: JSON.stringify([formattedRpcParams]),
    headerBlockNumber: "19463586",
    headerTimestamp: "1734695460",
    stateOverrides: JSON.stringify([
      {
        contractAddress: rpcParameters.sender,
        balance: "100000000000000000000"
      }
    ])
  })
  tenderlyUrl.search = params.toString()

  console.log("Tenderly Simulation URL:", tenderlyUrl.toString())

  try {
    const hash = await client.request(
      {
        method: "eth_sendUserOperation",
        params: [
          rpcParameters,
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          (entryPointAddress ?? account?.entryPoint.address)!
        ]
      },
      { retryCount: 0 }
    )
    console.log("User Operation Hash:", hash)
    return hash
  } catch (error) {
    // console.error("User Operation Failed:", error)
    const calls = (parameters as any).calls
    throw getUserOperationError(error as BaseError, {
      ...(request as UserOperation),
      ...(calls ? { calls } : {}),
      signature
    })
  }
}
