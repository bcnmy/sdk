import type { Address, Hash, Hex } from "viem"
import type { PartialBy } from "viem/chains"
import type {
  BigNumberish,
  BytesLike,
  UserOperationStruct
} from "../../accounts/utils/types"

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

export type FeeTokenInfo = {
  feeTokenAddress: string
}

export type SmartAccountInfo = {
  /** name: Name of the smart account */
  name: string
  /** version: Version of the smart account */
  version: string
}

export type FeeQuoteOrDataParameters = {
  userOperation: UserOperationStruct
  /** mode: sponsored or erc20 */
  mode?: PaymasterMode
  /** Expiry duration in seconds */
  expiryDuration?: number
  /** Always recommended, especially when using token paymaster */
  calculateGasLimits?: boolean
  /** List of tokens to be used for fee quotes, if ommitted fees for all supported will be returned */
  tokenList?: string[]
  /** preferredToken: Can be ommitted to return all quotes */
  preferredToken?: string
  /** Webhooks to be fired after user op is sent */
  webhookData?: Record<string, any>
  /** Smart account meta data */
  sponsorshipInfo?: {
    smartAccountInfo: {
      name: string
      version: string
    }
  }
}

export type FeeQuotesOrDataContext = {
  mode: PaymasterMode | undefined
  calculateGasLimits: boolean
  expiryDuration: number | undefined
  tokenInfo: {
    tokenList: string[]
    preferredToken: string | undefined
  }
  sponsorshipInfo: {
    webhookData: Record<string, any> | undefined
    smartAccountInfo: SmartAccountInfo
  }
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

export type PaymasterFeeQuote = {
  /** symbol: Token symbol */
  symbol: string
  /** tokenAddress: Token address */
  tokenAddress: string
  /** decimal: Token decimal */
  decimal: number
  logoUrl?: string
  /** maxGasFee: in wei */
  maxGasFee: number
  /** maxGasFee: in dollars */
  maxGasFeeUSD?: number
  usdPayment?: number
  /** The premium paid on the token */
  premiumPercentage: number
  /** validUntil: Unix timestamp */
  validUntil?: number
}

export type FeeQuotesOrDataSponsoredResponse = {
  mode: PaymasterMode
  /** Normally set to the spender in the proceeding call to send the tx */
  paymasterAddress?: Hex
  /** Relevant Data returned from the paymaster */
  paymasterAndData?: Uint8Array | Hex
  /* Gas overhead of this UserOperation */
  preVerificationGas?: BigNumberish
  /* Actual gas used by the validation of this UserOperation */
  verificationGasLimit?: BigNumberish
  /* Value used by inner account execution */
  callGasLimit?: BigNumberish
  userOpHash: Hash
}

export type FeeQuotesOrDataERC20Response = {
  mode: PaymasterMode
  /** Array of results from the paymaster */
  feeQuotes?: PaymasterFeeQuote[]
  /** Normally set to the spender in the proceeding call to send the tx */
  paymasterAddress?: Hex
  /** Relevant Data returned from the paymaster */
  paymasterAndData?: Uint8Array | Hex
  /* Gas overhead of this UserOperation */
  preVerificationGas?: BigNumberish
  /* Actual gas used by the validation of this UserOperation */
  verificationGasLimit?: BigNumberish
  /* Value used by inner account execution */
  callGasLimit?: BigNumberish
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
    Method: "pm_getFeeQuoteOrData"
    Parameters: [
      userOperation: PartialBy<
        UserOperationStruct,
        "callGasLimit" | "preVerificationGas" | "verificationGasLimit"
      >,
      context: FeeQuotesOrDataContext
    ]
    ReturnType: FeeQuotesOrDataERC20Response | FeeQuotesOrDataSponsoredResponse
  },
  {
    Method: "pm_accounts"
    Parameters: [entryPoint: Address]
    ReturnType: Address[]
  }
]
