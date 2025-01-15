import { prepareUserOperation } from "viem/account-abstraction"

import type { Chain, Client, Transport } from "viem"
import type {
  PrepareUserOperationParameters,
  PrepareUserOperationRequest,
  PrepareUserOperationReturnType,
  SmartAccount
} from "viem/account-abstraction"
import { getAction } from "viem/utils"

export async function prepareUserOperationWithoutSignature<
  account extends SmartAccount | undefined,
  const calls extends readonly unknown[],
  const request extends PrepareUserOperationRequest<
    account,
    accountOverride,
    calls
  >,
  accountOverride extends SmartAccount | undefined = undefined
>(
  client: Client<Transport, Chain | undefined, account>,
  args: PrepareUserOperationParameters<account, accountOverride, calls, request>
): Promise<
  Omit<
    PrepareUserOperationReturnType<account, accountOverride, calls, request>,
    "signature"
  >
> {
  const userOp = await getAction(
    client,
    prepareUserOperation,
    "prepareUserOperation"
  )(args)

  // Remove signature from userOp if it exists
  // @ts-ignore
  const { signature, ...userOpWithoutSignature } = userOp

  return userOpWithoutSignature
}
