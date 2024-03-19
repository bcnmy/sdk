import type { Address, Hex } from "viem"
import type { PartialBy } from "viem/chains"
import type {
  ENTRYPOINT_ADDRESS_V06_TYPE,
  UserOperationStruct
} from "../../accounts/utils/types"

export type SponsorUserOperationReturnType = {
  callGasLimit: Hex
  verificationGasLimit: Hex
  preVerificationGas: Hex
  paymasterAndData: Hex
}

export type SponsorUserOperationParameters = {
  userOperation: UserOperationStruct
  entryPoint: ENTRYPOINT_ADDRESS_V06_TYPE
  mode: PaymasterMode
}

export enum PaymasterMode {
  ERC20 = "ERC20",
  SPONSORED = "SPONSORED"
}

export type PaymasterRpcSchema = [
  {
    Method: "pm_sponsorUserOperation"
    Parameters: [
      userOperation: PartialBy<
        UserOperationStruct,
        "callGasLimit" | "preVerificationGas" | "verificationGasLimit"
      >,
      entryPoint: ENTRYPOINT_ADDRESS_V06_TYPE,
      context: PaymasterMode
    ]
    ReturnType: {
      paymasterAndData: Hex
      preVerificationGas: Hex
      verificationGasLimit: Hex
      callGasLimit: Hex
      paymaster?: never
      paymasterVerificationGasLimit?: never
      paymasterPostOpGasLimit?: never
      paymasterData?: never
    }
  },
  {
    Method: "pm_accounts"
    Parameters: [entryPoint: Address]
    ReturnType: Address[]
  }
]
