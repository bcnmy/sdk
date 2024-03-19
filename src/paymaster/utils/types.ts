import type { Address } from "viem"
import type { PartialBy } from "viem/chains"
import type { BytesLike, UserOperationStruct } from "../../accounts/utils/types"

export type SponsorUserOperationReturnType = {
  callGasLimit: string
  verificationGasLimit: string
  preVerificationGas: string
  paymasterAndData: BytesLike
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
      paymasterAndData: BytesLike
      preVerificationGas: string
      verificationGasLimit: string
      callGasLimit: string
    }
  },
  {
    Method: "pm_accounts"
    Parameters: [entryPoint: Address]
    ReturnType: Address[]
  }
]
