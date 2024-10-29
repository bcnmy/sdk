import type { NetworkSigner } from "@silencelaboratories/walletprovider-sdk"
import type { Chain, Client, Hex, Transport } from "viem"
import {
  type PrepareUserOperationParameters,
  prepareUserOperation
} from "viem/account-abstraction"
import { getAction, stringify } from "viem/utils"
import { ERROR_MESSAGES } from "../../../account"
import { deepHexlify } from "../../../account/utils/deepHexlify"
import { ENTRY_POINT_ADDRESS } from "../../../constants"
import { parseModule } from "../../utils/Helpers"
import type { ModularSmartAccount } from "../../utils/Types"
import type { DanModule } from "../toDan"

export type DANUserOp = {
  sender: string
  nonce: bigint
  data: string
  signature: string
  verificationGasLimit: bigint
  preVerificationGas: bigint
  callData: string
  callGasLimit: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  account: object // You might want to define a more specific type for this
  factory: string
  factoryData: string
}

export type DanUSerOperationMeta = {
  entryPointVersion: string
  entryPointAddress: string
  chainId: number
}

export type DANUserOperation = DanUSerOperationMeta & {
  userOperation: Partial<DANUserOp>
}

export const sendUserOperation = async <
  TModularSmartAccount extends ModularSmartAccount | undefined,
  chain extends Chain | undefined
>(
  client: Client<Transport, chain, TModularSmartAccount>,
  parameters: PrepareUserOperationParameters
): Promise<Hex> => {
  const { account: account_ = client.account } = parameters

  const preparedUserOperation = await getAction(
    client,
    prepareUserOperation,
    "prepareUserOperation"
  )(parameters)

  const chain = account_?.client?.chain
  const { networkSigner } = parseModule(client) as DanModule

  if (!chain) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  }

  const stringifiedMessage = stringify({
    userOperation: deepHexlify(preparedUserOperation),
    entryPointVersion: "v0.7.0",
    entryPointAddress: ENTRY_POINT_ADDRESS,
    chainId: chain.id
  })

  const danResponse: Awaited<ReturnType<NetworkSigner["authenticateAndSign"]>> =
    await networkSigner.authenticateAndSign("", stringifiedMessage)

  const v = danResponse.recid
  const sigV = v === 0 ? "1b" : "1c"

  const signature: Hex = `0x${danResponse.sign}${sigV}`

  console.log(signature)

  return "0x"
}
