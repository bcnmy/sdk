import { createPublicClient, http, parseEther, type Address } from "viem"
import { ENTRY_POINT_ADDRESS, EntrypointAbi } from "../../constants"
import { getSimulationUserOp } from "./tenderlySimulation"
import type { AnyUserOperation } from "./tenderlySimulation"
import { getChain } from "./getChain"

export async function contractSimulation(
  partialUserOp: AnyUserOperation,
  chainId: number
) {
  const packed = getSimulationUserOp(partialUserOp)

  return createPublicClient({
    chain: getChain(chainId),
    transport: http()
  }).simulateContract({
    account: partialUserOp.sender as Address,
    address: ENTRY_POINT_ADDRESS,
    abi: EntrypointAbi,
    functionName: "handleOps",
    args: [[packed], packed.sender],
    stateOverride: [
      {
        address: partialUserOp.sender as Address,
        balance: parseEther("1000")
      }
    ]
  })
}
