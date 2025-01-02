import type { Chain, Client, Hex, Prettify, Transport } from "viem"
import {
  type BicoUserOperationGasPriceWithBigIntAsHex,
  type GetGasFeeValuesReturnType,
  getGasFeeValues
} from "./getGasFeeValues"
import {
  type BicoUserOperationStatus,
  getUserOperationStatus
} from "./getUserOperationStatus"

export type BicoRpcSchema = [
  {
    Method: "biconomy_getGasFeeValues" | "pimlico_getUserOperationGasPrice"
    Parameters: []
    ReturnType: BicoUserOperationGasPriceWithBigIntAsHex
  },
  {
    Method: "biconomy_getUserOperationStatus"
    Parameters: [Hex]
    ReturnType: BicoUserOperationStatus
  }
]

export type BicoActions = {
  /**
   * Returns the live gas prices that you can use to send a user operation.
   *
   * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas {@link GetGasFeeValuesReturnType}
   *
   * @example
   *
   * import { createClient } from "viem"
   * import { bicoBundlerActions } from "@biconomy/sdk"
   *
   * const bundlerClient = createClient({
   *      chain: goerli,
   *      transport: http("https://api.biconomy.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE")
   * }).extend(bicoBundlerActions())
   *
   * await bundlerClient.getGasFeeValues()
   */
  getGasFeeValues: () => Promise<Prettify<GetGasFeeValuesReturnType>>
  /**
   * Returns the status of a user operation.
   *
   * @returns the status of a user operation {@link BicoUserOperationStatus}
   */
  getUserOperationStatus: (
    userOpHash: Hex
  ) => Promise<Prettify<BicoUserOperationStatus>>
}

export const bicoBundlerActions =
  () =>
  <
    TTransport extends Transport,
    TChain extends Chain | undefined = Chain | undefined
  >(
    client: Client<TTransport, TChain>
  ): BicoActions => ({
    getGasFeeValues: async () => getGasFeeValues(client),
    getUserOperationStatus: async (userOpHash: Hex) =>
      getUserOperationStatus(client, userOpHash)
  })
