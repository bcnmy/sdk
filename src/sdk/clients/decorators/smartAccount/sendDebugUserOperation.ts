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
  prepareUserOperation,
  toPackedUserOperation
} from "viem/account-abstraction"

import {
  http,
  type Assign,
  type BaseError,
  type Chain,
  type Client,
  type Hex,
  type MaybeRequired,
  type Narrow,
  type OneOf,
  type Transport,
  createPublicClient,
  parseEther,
  zeroAddress
} from "viem"
import { type Address, parseAccount } from "viem/accounts"
import { type RequestErrorType, getAction } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { getTenderlyDetails } from "../../../account/utils/Utils"
import { deepHexlify } from "../../../account/utils/deepHexlify"
import { getAAError } from "../../../account/utils/getAAError"
import { getChain } from "../../../account/utils/getChain"
import { ENTRY_POINT_ADDRESS, EntrypointAbi } from "../../../constants"
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
  const tenderlyDetails = getTenderlyDetails()

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

  const userOpWithSignature = {
    ...request,
    signature
  } as UserOperation

  const packed = toPackedUserOperation(userOpWithSignature)
  console.log(
    "Packed userOp:\n",
    JSON.stringify([deepHexlify(packed)], null, 2)
  )
  const rpcParameters = formatUserOperationRequest(userOpWithSignature)
  console.log("Bundler userOp:", rpcParameters)

  const chainId = client.account?.client?.chain?.id?.toString()

  if (tenderlyDetails) {
    const tenderlyUrl = new URL(
      `https://dashboard.tenderly.co/${tenderlyDetails.accountSlug}/${tenderlyDetails.projectSlug}/simulator/new`
    )

    const formattedRpcParams = {
      sender: rpcParameters.sender,
      nonce: rpcParameters.nonce,
      initCode: rpcParameters.initCode,
      callData: rpcParameters.callData,
      accountGasLimits: rpcParameters.callGasLimit,
      preVerificationGas: rpcParameters.preVerificationGas,
      gasFees: rpcParameters.maxFeePerGas,
      maxPriorityFeePerGas: rpcParameters.maxPriorityFeePerGas,
      paymasterAndData: rpcParameters.paymasterAndData,
      signature: rpcParameters.signature
    }

    const params = new URLSearchParams({
      contractAddress: ENTRY_POINT_ADDRESS,
      value: "0",
      network: chainId ?? "84532",
      contractFunction: "0x765e827f",
      rawFunctionInput: packed.callData,
      functionInputs: JSON.stringify([formattedRpcParams]),
      stateOverrides: JSON.stringify([
        {
          contractAddress: rpcParameters.sender,
          balance: "100000000000000000000"
        }
      ])
    })
    tenderlyUrl.search = params.toString()
  } else {
    console.log(
      "Tenderly details not found in environment variables. Please set TENDERLY_API_KEY, TENDERLY_ACCOUNT_SLUG, and TENDERLY_PROJECT_SLUG."
    )
  }

  try {
    const simulation = await createPublicClient({
      chain: client.account?.client?.chain ?? getChain(Number(chainId)),
      transport: http()
    }).simulateContract({
      account: rpcParameters.sender,
      address: ENTRY_POINT_ADDRESS,
      abi: EntrypointAbi,
      functionName: "handleOps",
      args: [[packed], rpcParameters.sender],
      stateOverride: [
        {
          address: rpcParameters.sender,
          balance: parseEther("1000")
        }
      ]
    })

    console.log("Simulation:", { simulation })
  } catch (error) {
    console.error("Simulation failed")
  }

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

    if (error?.details) {
      const aaError = await getAAError(error.details)
      console.log({ aaError })
    }

    const calls = (parameters as any).calls
    throw getUserOperationError(error as BaseError, {
      ...(request as UserOperation),
      ...(calls ? { calls } : {}),
      signature
    })
  }
}
