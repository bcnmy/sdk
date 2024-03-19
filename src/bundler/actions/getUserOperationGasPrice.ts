// import type { Account, Chain, Client, Transport } from "viem"
// import { BigNumberish } from "../../accounts/utils/types"
// import { BundlerRpcSchema } from "../utils/types"
// import { Prettify } from "viem/chains"

// export type GetUserOperationGasPriceReturnType = {
//     slow: {
//         maxFeePerGas: BigNumberish
//         maxPriorityFeePerGas: BigNumberish
//     }
//     standard: {
//         maxFeePerGas: BigNumberish
//         maxPriorityFeePerGas: BigNumberish
//     }
//     fast: {
//         maxFeePerGas: BigNumberish
//         maxPriorityFeePerGas: BigNumberish
//     }
// }

// /**
//  * Returns the live gas prices that you can use to send a user operation.
//  *
//  * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-bundler-actions/getUserOperationGasPrice
//  *
//  * @param client that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
//  * @returns slow, standard & fast values for maxFeePerGas & maxPriorityFeePerGas
//  *
//  *
//  * @example
//  * import { createClient } from "viem"
//  * import { getUserOperationGasPrice } from "permissionless/actions/pimlico"
//  *
//  * const bundlerClient = createClient({
//  *      chain: goerli,
//  *      transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE")
//  * })
//  *
//  * await getUserOperationGasPrice(bundlerClient)
//  *
//  */
// export const getUserOperationGasPrice = async <
//     TTransport extends Transport = Transport,
//     TChain extends Chain | undefined = Chain | undefined,
//     TAccount extends Account | undefined = Account | undefined
// >(
//     client: Client<TTransport, TChain, TAccount, BundlerRpcSchema>
// ): Promise<Prettify<GetUserOperationGasPriceReturnType>> => {
//     const gasPrice = await client.request({
//         method: "pimlico_getUserOperationGasPrice",
//         params: []
//     })

//     return {
//         slow: {
//             maxFeePerGas: BigInt(gasPrice.slow.maxFeePerGas),
//             maxPriorityFeePerGas: BigInt(gasPrice.slow.maxPriorityFeePerGas)
//         },
//         standard: {
//             maxFeePerGas: BigInt(gasPrice.standard.maxFeePerGas),
//             maxPriorityFeePerGas: BigInt(gasPrice.standard.maxPriorityFeePerGas)
//         },
//         fast: {
//             maxFeePerGas: BigInt(gasPrice.fast.maxFeePerGas),
//             maxPriorityFeePerGas: BigInt(gasPrice.fast.maxPriorityFeePerGas)
//         }
//     }
// }
