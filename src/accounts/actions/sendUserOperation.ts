import { AccountOrClientNotFoundError, parseAccount } from "permissionless"
import type { Chain, Client, Hash, Transport } from "viem"
import type { PartialBy, Prettify } from "viem/chains"
import { sendUserOperation as sendUserOperationBundler } from "../../bundler/index"
import { getAction } from "../utils/helpers"
import type {
  GetAccountParameter,
  Middleware,
  SmartAccount,
  UserOperationStruct
} from "../utils/types"
import { prepareUserOperationRequest } from "./prepareUserOperationRequest"

export type SendUserOperationParameters = {
  userOperation: PartialBy<
    UserOperationStruct,
    | "sender"
    | "nonce"
    | "initCode"
    | "callGasLimit"
    | "verificationGasLimit"
    | "preVerificationGas"
    | "maxFeePerGas"
    | "maxPriorityFeePerGas"
    | "paymasterAndData"
    | "signature"
  >
} & GetAccountParameter &
  Middleware

export async function sendUserOperation<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
  client: Client<TTransport, TChain, TAccount>,
  args: Prettify<SendUserOperationParameters>
): Promise<Hash> {
  const { account: account_ = client.account } = args
  if (!account_) throw new AccountOrClientNotFoundError()

  const account = parseAccount(account_) as SmartAccount

  const userOperation = await getAction(
    client,
    prepareUserOperationRequest<TTransport, TChain, TAccount>
  )(args)

  userOperation.signature = await account.signUserOperation(
    userOperation as UserOperationStruct
  )

  return sendUserOperationBundler(client, {
    userOperation: userOperation as UserOperationStruct
  })
}
