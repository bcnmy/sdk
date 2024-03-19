import type { Address, Hex } from "viem"
import type { PartialBy } from "viem/chains"
import type { UserOperationStruct } from "../../accounts/utils/types"

export type SponsorUserOperationReturnType = {
  callGasLimit: Hex
  verificationGasLimit: Hex
  preVerificationGas: Hex
  paymasterAndData: Hex
}

export type SponsorUserOperationParameters = {
  userOperation: UserOperationStruct
  mode: PaymasterMode
}

export enum PaymasterMode {
  ERC20 = "ERC20",
  SPONSORED = "SPONSORED"
}

export type PaymasterContext = {
  mode: PaymasterMode
  calculateGasLimits: boolean
  sponsorshipInfo: {
    smartAccountInfo: {
      name: string
      version: string
    }
  }
}

export type PaymasterRpcSchema = [
  {
    Method: "pm_sponsorUserOperation"
    Parameters: [
      userOperation: PartialBy<
        UserOperationStruct,
        "callGasLimit" | "preVerificationGas" | "verificationGasLimit"
      >,
      context: PaymasterContext
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
