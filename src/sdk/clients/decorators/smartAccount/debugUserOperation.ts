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

import type {
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
import { type Address, parseAccount } from "viem/accounts"
import { type RequestErrorType, getAction } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { parseRequestArguments } from "../../../account/utils/Utils"
import { deepHexlify } from "../../../account/utils/deepHexlify"
import { getAAError } from "../../../account/utils/getAAError"
import { tenderlySimulation } from "../../../account/utils/tenderlySimulation"
export type DebugUserOperationParameters<
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
export type DebugUserOperationReturnType = Hex

export type DebugUserOperationErrorType =
  | FormatUserOperationRequestErrorType
  | PrepareUserOperationErrorType
  | RequestErrorType

/**
 * Broadcasts a User Operation to the Bundler.
 *
 * - Docs: https://viem.sh/actions/bundler/debugUserOperation
 *
 * @param client - Client to use
 * @param parameters - {@link DebugUserOperationParameters}
 * @returns The User Operation hash. {@link DebugUserOperationReturnType}
 *
 * @example
 * import { createBundlerClient, http, parseEther } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { toSmartAccount } from 'viem/accounts'
 * import { debugUserOperation } from 'viem/actions'
 *
 * const account = await toSmartAccount({ ... })
 *
 * const bundlerClient = createBundlerClient({
 *   chain: mainnet,
 *   transport: http(),
 * })
 *
 * const values = await debugUserOperation(bundlerClient, {
 *   account,
 *   calls: [{ to: '0x...', value: parseEther('1') }],
 * })
 */
export async function debugUserOperation<
  const calls extends readonly unknown[],
  account extends SmartAccount | undefined,
  accountOverride extends SmartAccount | undefined = undefined
>(
  client: Client<Transport, Chain | undefined, account>,
  parameters: DebugUserOperationParameters<account, accountOverride, calls>
) {
  const chainId = Number(client.account?.client?.chain?.id?.toString() ?? 84532)

  try {
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

    const tenderlyUrl = tenderlySimulation(rpcParameters, chainId)
    console.log({ tenderlyUrl })

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
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
      if (error?.details) {
        const aaError = await getAAError(error?.details)
        console.log({ aaError })
      }

      const calls = (parameters as any).calls
      throw getUserOperationError(error as BaseError, {
        ...(request as UserOperation),
        ...(calls ? { calls } : {}),
        signature
      })
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (error: any) {
    if (error.metaMessages) {
      try {
        const messageJson = parseRequestArguments(error.metaMessages)
        const tenderlyUrl = tenderlySimulation(messageJson)
        console.log({ tenderlyUrl })
      } catch (error) {}
    }
    throw error
  }
}
