import type { Client } from "viem"
import { chainId } from "./chainId.js"

export type BundlerRpcSchema = [
  {
    Method: "eth_chainId"
    Params: []
    ReturnType: bigint
  }
]

export type BundlerActions = Record<"chainId", () => Promise<number>>
export const bundlerActions =
  () =>
  (client: Client): BundlerActions => ({
    chainId: () => chainId(client)
  })
