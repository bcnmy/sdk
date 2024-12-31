import {
  toPackedUserOperation,
  type UserOperation
} from "viem/account-abstraction"
import type { RpcUserOperation } from "viem"
import { ENTRY_POINT_ADDRESS } from "../../constants"
import { getTenderlyDetails } from "."
import { deepHexlify } from "./deepHexlify"

export type AnyUserOperation = Partial<UserOperation<"0.7"> | RpcUserOperation>

export const getSimulationUserOp = (partialUserOp: AnyUserOperation) => {
  const simulationGasLimits = {
    callGasLimit: 100_000_000_000n,
    verificationGasLimit: 100_000_000_000n,
    preVerificationGas: 1n,
    maxFeePerGas: 100_000_000_000n,
    maxPriorityFeePerGas: 1n,
    paymasterVerificationGasLimit: 100_000_000_000n,
    paymasterPostOpGasLimit: 100_000n
  }

  const mergedUserOp = deepHexlify({
    ...simulationGasLimits,
    ...partialUserOp
  })

  return toPackedUserOperation(mergedUserOp)
}

export function tenderlySimulation(
  partialUserOp: AnyUserOperation,
  chainId = 84532
) {
  const tenderlyDetails = getTenderlyDetails()

  if (!tenderlyDetails) {
    console.log(
      "Tenderly details not found in environment variables. Please set TENDERLY_API_KEY, TENDERLY_ACCOUNT_SLUG, and TENDERLY_PROJECT_SLUG."
    )
    return null
  }

  const tenderlyUrl = new URL(
    `https://dashboard.tenderly.co/${tenderlyDetails.accountSlug}/${tenderlyDetails.projectSlug}/simulator/new`
  )

  const packedUserOp = getSimulationUserOp(partialUserOp)

  const params = new URLSearchParams({
    contractAddress: ENTRY_POINT_ADDRESS,
    value: "0",
    network: chainId.toString(),
    contractFunction: "0x765e827f", // handleOps
    functionInputs: JSON.stringify([packedUserOp]),
    stateOverrides: JSON.stringify([
      {
        contractAddress: packedUserOp.sender,
        balance: "100000000000000000000"
      }
    ])
  })

  tenderlyUrl.search = params.toString()
  return tenderlyUrl.toString()
}
