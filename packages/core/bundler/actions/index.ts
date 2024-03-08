import type { Client } from "viem"
import { chainId } from "./chainId.js"

export type BundlerRpcSchema = [
  {
    Method: "eth_chainId"
    Params: []
    ReturnType: bigint
  }
]

export const bundlerActions = () => (client: Client) => ({
  chainId: () => chainId(client)
})
