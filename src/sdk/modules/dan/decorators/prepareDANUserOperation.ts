import type { PrepareUserOperationParameters } from "viem/account-abstraction"
import { ERROR_MESSAGES } from "../../../account"
import type { NexusClient } from "../../../clients/createNexusClient"
import { ENTRY_POINT_ADDRESS } from "../../../constants"

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

export const prepareDANUserOperation = async (
  client: NexusClient,
  parameters: PrepareUserOperationParameters
): Promise<DANUserOperation> => {
  const preparedUserOperation = await client.prepareUserOperation(parameters)
  const chain = client?.account?.client?.chain

  if (!chain) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  }

  return {
    userOperation: preparedUserOperation,
    entryPointVersion: "v0.7.0",
    entryPointAddress: ENTRY_POINT_ADDRESS,
    chainId: chain.id
  }
}
