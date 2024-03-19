import { AccountOrClientNotFoundError, parseAccount } from "permissionless"
import { type Chain, type Client, type Hex, type Transport, toHex } from "viem"
import { estimateFeesPerGas } from "viem/actions"
import type { Prettify } from "viem/chains"
import { estimateUserOperationGas } from "../../bundler/actions/estimateUserOperationGas"
import type { StateOverrides } from "../../bundler/utils/types"
import { getAction } from "../utils/helpers"
import type {
  ENTRYPOINT_ADDRESS_V06_TYPE,
  PrepareUserOperationRequestParameters,
  SmartAccount,
  UserOperationStruct
} from "../utils/types"

async function prepareUserOperationRequestForEntryPointV06<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
  client: Client<TTransport, TChain, TAccount>,
  args: Prettify<PrepareUserOperationRequestParameters>,
  stateOverrides?: StateOverrides
): Promise<Prettify<UserOperationStruct>> {
  const {
    account: account_ = client.account,
    userOperation: partialUserOperation,
    middleware
  } = args
  if (!account_) throw new AccountOrClientNotFoundError()

  const account = parseAccount(
    account_
  ) as SmartAccount<ENTRYPOINT_ADDRESS_V06_TYPE>

  const [sender, nonce, initCode, callData] = await Promise.all([
    partialUserOperation.sender || account.address,
    partialUserOperation.nonce || account.getNonce(),
    partialUserOperation.initCode || account.getInitCode(),
    partialUserOperation.callData
  ])

  const userOperation: UserOperationStruct = {
    sender,
    nonce,
    initCode,
    callData,
    paymasterAndData: "0x",
    signature: partialUserOperation.signature || "0x",
    maxFeePerGas: partialUserOperation.maxFeePerGas || ("0" as Hex),
    maxPriorityFeePerGas:
      partialUserOperation.maxPriorityFeePerGas || ("0" as Hex),
    callGasLimit: partialUserOperation.callGasLimit || ("0" as Hex),
    verificationGasLimit:
      partialUserOperation.verificationGasLimit || ("0" as Hex),
    preVerificationGas: partialUserOperation.preVerificationGas || ("0" as Hex)
  }

  if (userOperation.signature === "0x") {
    userOperation.signature = await account.getDummySignature(userOperation)
  }

  if (typeof middleware === "function") {
    return await middleware({ userOperation })
  }

  if (middleware && typeof middleware !== "function" && middleware.gasPrice) {
    const gasPrice = await middleware.gasPrice()
    userOperation.maxFeePerGas = toHex(gasPrice.maxFeePerGas)
    userOperation.maxPriorityFeePerGas = toHex(gasPrice.maxPriorityFeePerGas)
  }

  if (!userOperation.maxFeePerGas || !userOperation.maxPriorityFeePerGas) {
    const estimateGas = await estimateFeesPerGas(account.client)
    userOperation.maxFeePerGas =
      userOperation.maxFeePerGas || toHex(estimateGas.maxFeePerGas)
    userOperation.maxPriorityFeePerGas =
      userOperation.maxPriorityFeePerGas ||
      toHex(estimateGas.maxPriorityFeePerGas)
  }

  if (
    middleware &&
    typeof middleware !== "function" &&
    middleware.sponsorUserOperation
  ) {
    const sponsorUserOperationData = (await middleware.sponsorUserOperation({
      userOperation,
      entryPoint: account.entryPoint
    } as {
      userOperation: UserOperationStruct
      entryPoint: ENTRYPOINT_ADDRESS_V06_TYPE
    })) as Pick<
      UserOperationStruct,
      | "callGasLimit"
      | "verificationGasLimit"
      | "preVerificationGas"
      | "paymasterAndData"
    >

    userOperation.callGasLimit = sponsorUserOperationData.callGasLimit
    userOperation.verificationGasLimit =
      sponsorUserOperationData.verificationGasLimit
    userOperation.preVerificationGas =
      sponsorUserOperationData.preVerificationGas
    userOperation.paymasterAndData = sponsorUserOperationData.paymasterAndData
  }

  if (
    !userOperation.callGasLimit ||
    !userOperation.verificationGasLimit ||
    !userOperation.preVerificationGas
  ) {
    const gasParameters = await getAction(client, estimateUserOperationGas)(
      {
        userOperation,
        entryPoint: account.entryPoint
      } as {
        userOperation: UserOperationStruct
        entryPoint: ENTRYPOINT_ADDRESS_V06_TYPE
      },
      stateOverrides
    )

    userOperation.callGasLimit = toHex(gasParameters.callGasLimit)
    userOperation.verificationGasLimit =
      userOperation.verificationGasLimit ||
      toHex(gasParameters.verificationGasLimit)
    userOperation.preVerificationGas =
      userOperation.preVerificationGas ||
      toHex(gasParameters.preVerificationGas)
  }

  return userOperation as UserOperationStruct
}

export async function prepareUserOperationRequest<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
  client: Client<TTransport, TChain, TAccount>,
  args: Prettify<PrepareUserOperationRequestParameters>,
  stateOverrides?: StateOverrides
): Promise<UserOperationStruct> {
  const { account: account_ = client.account } = args
  if (!account_) throw new AccountOrClientNotFoundError()

  return prepareUserOperationRequestForEntryPointV06(
    client,
    args,
    stateOverrides
  ) as Promise<UserOperationStruct>
}
