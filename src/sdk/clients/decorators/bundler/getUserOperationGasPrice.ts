import type { Account, Chain, Client, Hex, Transport } from "viem"
import { shouldUsePimlico } from "../../../account/utils/Utils"

const conditionalMethod = shouldUsePimlico
  ? "pimlico_getUserOperationGasPrice"
  : "biconomy_getGasFeeValues"

export type BicoRpcSchema = [
  {
    Method: "biconomy_getGasFeeValues" | "pimlico_getUserOperationGasPrice"
    Parameters: []
    ReturnType: BicoUserOperationGasPriceWithBigIntAsHex
  }
]

type BicoUserOperationGasPriceWithBigIntAsHex = {
  slow: {
    maxFeePerGas: Hex
    maxPriorityFeePerGas: Hex
  }
  standard: {
    maxFeePerGas: Hex
    maxPriorityFeePerGas: Hex
  }
  fast: {
    maxFeePerGas: Hex
    maxPriorityFeePerGas: Hex
  }
}

export type GetUserOperationGasPriceReturnType = {
  slow: {
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }
  standard: {
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }
  fast: {
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }
}

/**
 * Returns the live gas prices that you can use to send a user operation.
 *
 * @param client that you created using viem's createClient whose transport url is pointing to the Biconomy's bundler.
 * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationGasPrice } from "permissionless/actions/pimlico"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://biconomy.io/api/v3/5/your-api-key"),
 * })
 *
 * await getUserOperationGasPrice(bundlerClient)
 *
 */
export const getUserOperationGasPrice = async (
  client: Client<
    Transport,
    Chain | undefined,
    Account | undefined,
    BicoRpcSchema
  >
): Promise<GetUserOperationGasPriceReturnType> => {
  const gasPrice = await client.request({
    method: conditionalMethod,
    params: []
  })

  return {
    slow: {
      maxFeePerGas: BigInt(gasPrice.slow.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(gasPrice.slow.maxPriorityFeePerGas)
    },
    standard: {
      maxFeePerGas: BigInt(gasPrice.standard.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(gasPrice.standard.maxPriorityFeePerGas)
    },
    fast: {
      maxFeePerGas: BigInt(gasPrice.fast.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(gasPrice.fast.maxPriorityFeePerGas)
    }
  }
}
