import type { Hex } from "viem"
import type { PaymasterClient } from "../createPaymasterClient"
import { deepHexlify } from "../utils/helpers"
import type {
  SponsorUserOperationParameters,
  SponsorUserOperationReturnType
} from "../utils/types"

export const sponsorUserOperation = async (
  client: PaymasterClient,
  args: SponsorUserOperationParameters
): Promise<SponsorUserOperationReturnType> => {
  console.log(deepHexlify(args.userOperation), "args.userOperation")

  const response = await client.request({
    method: "pm_sponsorUserOperation",
    params: [
      deepHexlify(args.userOperation),
      {
        mode: args.mode,
        calculateGasLimits: true,
        sponsorshipInfo: {
          smartAccountInfo: {
            name: "BICONOMY",
            version: "2.0.0"
          }
        }
      }
    ]
  })

  console.log(response, "response")

  const responseV06 = response as {
    paymasterAndData: Hex
    preVerificationGas: Hex
    verificationGasLimit: Hex
    callGasLimit: Hex
    paymaster?: never
    paymasterVerificationGasLimit?: never
    paymasterPostOpGasLimit?: never
    paymasterData?: never
  }
  return {
    paymasterAndData: responseV06.paymasterAndData,
    preVerificationGas: responseV06.preVerificationGas,
    verificationGasLimit: responseV06.verificationGasLimit,
    callGasLimit: responseV06.callGasLimit
  } as SponsorUserOperationReturnType
}
