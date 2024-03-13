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
  (): PaymasterActions => ({
    sponsorUserOperation: () => sponsorUserOperation()
  })
