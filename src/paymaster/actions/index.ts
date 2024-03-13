import type { Client } from "viem"
import { sponsorUserOperation } from "./sponsorUserOperation.js"

export type PaymasterRpcSchema = [
  {
    Method: "eth_chainId"
    Params: []
    ReturnType: bigint
  }
]

export type PaymasterActions = Record<
  "sponsorUserOperation",
  () => Promise<number>
>
export const paymasterActions =
  () =>
  (client: Client): PaymasterActions => ({
    sponsorUserOperation: () => sponsorUserOperation(client)
  })
