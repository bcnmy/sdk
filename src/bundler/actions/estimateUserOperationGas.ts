import type { Account, Chain, Client, Hex, Transport } from "viem"
import type { Prettify } from "viem/chains"
import { ENTRYPOINT_ADDRESS_V06 } from "../../accounts/utils/constants"
import { deepHexlify } from "../../paymaster/utils/helpers"
import type {
  BundlerRpcSchema,
  EstimateUserOperationGasParameters,
  StateOverrides
} from "../utils/types"

export const estimateUserOperationGas = async <
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined
>(
  client: Client<TTransport, TChain, TAccount, BundlerRpcSchema>,
  args: Prettify<EstimateUserOperationGasParameters>,
  stateOverrides?: StateOverrides
): Promise<{
  preVerificationGas: bigint
  verificationGasLimit: bigint
  callGasLimit: bigint
}> => {
  const { userOperation } = args

  const userOperationWithBigIntAsHex = deepHexlify(userOperation)
  const stateOverridesWithBigIntAsHex = deepHexlify(stateOverrides)

  try {
    const response = await client.request({
      method: "eth_estimateUserOperationGas",
      params: stateOverrides
        ? [
            userOperationWithBigIntAsHex,
            ENTRYPOINT_ADDRESS_V06,
            stateOverridesWithBigIntAsHex
          ]
        : [userOperationWithBigIntAsHex, ENTRYPOINT_ADDRESS_V06]
    })

    const responseV06 = response as {
      preVerificationGas: Hex
      verificationGasLimit: Hex
      callGasLimit: Hex
    }

    return {
      preVerificationGas: BigInt(responseV06.preVerificationGas || 0),
      verificationGasLimit: BigInt(responseV06.verificationGasLimit || 0),
      callGasLimit: BigInt(responseV06.callGasLimit || 0)
    } as {
      preVerificationGas: bigint
      verificationGasLimit: bigint
      callGasLimit: bigint
    }
  } catch (err) {
    throw new Error("Error estimating user operation gas. ")
  }
}
