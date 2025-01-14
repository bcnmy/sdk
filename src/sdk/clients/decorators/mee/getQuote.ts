import type { Address, Hex, OneOf } from "viem"
import type { MultichainSmartAccount } from "../../../account/toMultiChainNexusAccount"
import type { BaseMeeClient } from "../../createMeeClient"

/**
 * Represents an abstract call to be executed in the transaction
 */
export type AbstractCall = {
  /** Address of the contract to call */
  to: Address
  /** Gas limit for the call execution */
  gasLimit: bigint
} & OneOf<
  | { value: bigint; data?: Hex }
  | { value?: bigint; data: Hex }
  | { value: bigint; data: Hex }
>

/**
 * Information about the fee token to be used for the transaction
 */
export type FeeTokenInfo = {
  /** Address of the fee token */
  address: Address
  /** Chain ID where the fee token is deployed */
  chainId: number
}

/**
 * Information about the instructions to be executed in the transaction
 * @internal
 */
export type Instruction = {
  /** Array of abstract calls to be executed in the transaction */
  calls: AbstractCall[]
  /** Chain ID where the transaction will be executed */
  chainId: number
}

/**
 * Represents a supertransaction, which is a collection of instructions to be executed in a single transaction
 * @type SuperTransaction
 */
export type SuperTransaction = {
  /** Array of instructions to be executed in the transaction */
  instructions: Instruction[]
  /** Token to be used for paying transaction fees */
  feeToken: FeeTokenInfo
}

/**
 * Parameters required for requesting a quote from the MEE service
 * @type GetQuoteParams
 */
export type GetQuoteParams = SuperTransaction & {
  /** Optional smart account to execute the transaction. If not provided, uses the client's default account */
  account?: MultichainSmartAccount
}

/**
 * Internal structure for submitting a quote request to the MEE service
 * @internal
 */
type QuoteRequest = {
  /** Array of user operations to be executed */
  userOps: {
    /** Address of the account initiating the operation */
    sender: string
    /** Encoded transaction data */
    callData: string
    /** Gas limit for the call execution */
    callGasLimit: string
    /** Account nonce */
    nonce: string
    /** Chain ID where the operation will be executed */
    chainId: string
  }[]
  /** Payment details for the transaction */
  paymentInfo: PaymentInfo
}

/**
 * Basic payment information required for a quote request
 * @interface PaymentInfo
 */
export type PaymentInfo = {
  /** Address of the account paying for the transaction */
  sender: Address
  /** Optional initialization code for account deployment */
  initCode?: Hex
  /** Address of the token used for payment */
  token: Address
  /** Current nonce of the sender account */
  nonce: string
  /** Chain ID where the payment will be processed */
  chainId: string
}

/**
 * Extended payment information including calculated token amounts
 * @interface FilledPaymentInfo
 * @extends {Required<PaymentInfo>}
 */
export type FilledPaymentInfo = Required<PaymentInfo> & {
  /** Human-readable token amount */
  tokenAmount: string
  /** Token amount in wei */
  tokenWeiAmount: string
  /** Token value in the transaction */
  tokenValue: string
}

/**
 * Detailed user operation structure with all required fields
 * @interface MeeFilledUserOp
 */
export interface MeeFilledUserOp {
  /** Address of the account initiating the operation */
  sender: Address
  /** Account nonce */
  nonce: string
  /** Account initialization code */
  initCode: Hex
  /** Encoded transaction data */
  callData: Hex
  /** Gas limit for the call execution */
  callGasLimit: string
  /** Gas limit for verification */
  verificationGasLimit: string
  /** Maximum fee per gas unit */
  maxFeePerGas: string
  /** Maximum priority fee per gas unit */
  maxPriorityFeePerGas: string
  /** Encoded paymaster data */
  paymasterAndData: Hex
  /** Gas required before operation verification */
  preVerificationGas: string
}

/**
 * Extended user operation details including timing and gas parameters
 * @interface MeeFilledUserOpDetails
 */
export interface MeeFilledUserOpDetails {
  /** Complete user operation data */
  userOp: MeeFilledUserOp
  /** Hash of the user operation */
  userOpHash: Hex
  /** MEE-specific hash of the user operation */
  meeUserOpHash: Hex
  /** Lower bound timestamp for operation validity */
  lowerBoundTimestamp: string
  /** Upper bound timestamp for operation validity */
  upperBoundTimestamp: string
  /** Maximum gas limit for the operation */
  maxGasLimit: string
  /** Maximum fee per gas unit */
  maxFeePerGas: string
  /** Chain ID where the operation will be executed */
  chainId: string
}

/**
 * Complete quote response from the MEE service
 * @type GetQuotePayload
 */
export type GetQuotePayload = {
  /** Hash of the supertransaction */
  hash: Hex
  /** Address of the MEE node */
  node: Address
  /** Commitment hash */
  commitment: Hex
  /** Complete payment information with token amounts */
  paymentInfo: FilledPaymentInfo
  /** Array of user operations with their details */
  userOps: MeeFilledUserOpDetails[]
}

/**
 * Requests a quote from the MEE service for executing a set of instructions
 * @async
 * @param client - MEE client instance used to make the request
 * @param params - Parameters for the quote request
 * @returns Promise resolving to a committed supertransaction quote
 * @throws Error if the account is not deployed on any required chain
 * @example
 * ```typescript
 * const quote = await getQuote(meeClient, {
 *   instructions: [...],
 *   feeToken: { address: '0x...', chainId: 1 },
 *   account: smartAccount
 * });
 * ```
 */
export const getQuote = async (
  client: BaseMeeClient,
  params: GetQuoteParams
): Promise<GetQuotePayload> => {
  const { account: account_ = client.account, instructions, feeToken } = params

  const validUserOps = instructions.every((userOp) =>
    account_.deploymentOn(userOp.chainId)
  )
  const validPaymentAccount = account_.deploymentOn(feeToken.chainId)
  if (!validPaymentAccount || !validUserOps) {
    throw Error("Account is not deployed on necessary chain(s)")
  }

  const userOpResults = await Promise.all(
    instructions.map((userOp) => {
      const deployment = account_.deploymentOn(userOp.chainId)
      if (deployment) {
        return Promise.all([
          deployment.encodeExecuteBatch(userOp.calls),
          deployment.getNonce(),
          deployment.isDeployed(),
          deployment.getInitCode(),
          deployment.address,
          userOp.calls
            .map((tx) => tx.gasLimit)
            .reduce((curr, acc) => curr + acc)
            .toString(),
          userOp.chainId.toString()
        ])
      }
      return null
    })
  )

  const validUserOpResults = userOpResults.filter(Boolean) as [
    Hex,
    bigint,
    boolean,
    Hex,
    Address,
    string,
    string
  ][]

  const userOps = validUserOpResults.map(
    ([
      callData,
      nonce_,
      isAccountDeployed,
      initCode,
      sender,
      callGasLimit,
      chainId
    ]) => ({
      sender,
      callData,
      callGasLimit,
      nonce: nonce_.toString(),
      chainId,
      ...(!isAccountDeployed && initCode ? { initCode } : {})
    })
  )

  const [nonce, isAccountDeployed, initCode] = await Promise.all([
    validPaymentAccount.getNonce(),
    validPaymentAccount.isDeployed(),
    validPaymentAccount.getInitCode()
  ])

  const paymentInfo: PaymentInfo = {
    sender: validPaymentAccount.address,
    token: feeToken.address,
    nonce: nonce.toString(),
    chainId: feeToken.chainId.toString(),
    ...(!isAccountDeployed && initCode ? { initCode } : {})
  }

  const quoteRequest: QuoteRequest = {
    userOps,
    paymentInfo
  }

  return await client.request<GetQuotePayload>({
    path: "v1/quote",
    body: quoteRequest
  })
}

export default getQuote
