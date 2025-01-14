import { type Address, parseAbi } from "abitype"

import { encodeFunctionData, erc20Abi } from "viem"
import { createHttpClient } from "../../clients/createHttpClient"
import type {
  AbstractCall,
  Instruction
} from "../../clients/decorators/mee/getQuote"
import type {
  BridgingPlugin,
  BridgingPluginResult,
  BridgingUserOpParams
} from "../decorators/buildBridgeInstructions"

export interface AcrossRelayFeeResponse {
  totalRelayFee: {
    pct: string
    total: string
  }
  relayerCapitalFee: {
    pct: string
    total: string
  }
  relayerGasFee: {
    pct: string
    total: string
  }
  lpFee: {
    pct: string
    total: string
  }
  timestamp: string
  isAmountTooLow: boolean
  quoteBlock: string
  spokePoolAddress: Address
  exclusiveRelayer: Address
  exclusivityDeadline: string
}

type AcrossSuggestedFeesParams = {
  inputToken: Address
  outputToken: Address
  originChainId: number
  destinationChainId: number
  amount: bigint
}

// Create HTTP client instance
const acrossClient = createHttpClient("https://app.across.to/api")

const acrossGetSuggestedFees = async ({
  inputToken,
  outputToken,
  originChainId,
  destinationChainId,
  amount
}: AcrossSuggestedFeesParams): Promise<AcrossRelayFeeResponse> =>
  acrossClient.request<AcrossRelayFeeResponse>({
    path: "suggested-fees",
    method: "GET",
    params: {
      inputToken,
      outputToken,
      originChainId: originChainId.toString(),
      destinationChainId: destinationChainId.toString(),
      amount: amount.toString()
    }
  })

export const acrossEncodeBridgingUserOp = async (
  params: BridgingUserOpParams
): Promise<BridgingPluginResult> => {
  const { bridgingAmount, fromChain, account, toChain, tokenMapping } = params

  const inputToken = tokenMapping.on(fromChain.id)
  const outputToken = tokenMapping.on(toChain.id)
  const depositor = account.deploymentOn(fromChain.id)?.address
  const recipient = account.deploymentOn(toChain.id)?.address

  if (!depositor || !recipient) {
    throw new Error("No depositor or recipient found")
  }

  const suggestedFees = await acrossGetSuggestedFees({
    amount: bridgingAmount,
    destinationChainId: toChain.id,
    inputToken: inputToken,
    outputToken: outputToken,
    originChainId: fromChain.id
  })

  const depositV3abi = parseAbi([
    "function depositV3(address depositor, address recipient, address inputToken, address outputToken, uint256 inputAmount, uint256 outputAmount, uint256 destinationChainId, address exclusiveRelayer, uint32 quoteTimestamp, uint32 fillDeadline, uint32 exclusivityDeadline, bytes message) external"
  ])

  const outputAmount =
    BigInt(bridgingAmount) - BigInt(suggestedFees.totalRelayFee.total)

  const fillDeadlineBuffer = 18000
  const fillDeadline = Math.round(Date.now() / 1000) + fillDeadlineBuffer

  const approveCall: AbstractCall = {
    to: inputToken,
    gasLimit: 100000n,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [suggestedFees.spokePoolAddress, bridgingAmount]
    })
  }

  const depositCall: AbstractCall = {
    to: suggestedFees.spokePoolAddress,
    gasLimit: 150000n,
    data: encodeFunctionData({
      abi: depositV3abi,
      args: [
        depositor,
        recipient,
        inputToken,
        outputToken,
        bridgingAmount,
        outputAmount,
        BigInt(toChain.id),
        suggestedFees.exclusiveRelayer,
        Number.parseInt(suggestedFees.timestamp),
        fillDeadline,
        Number.parseInt(suggestedFees.exclusivityDeadline),
        "0x" // message
      ]
    })
  }

  const userOp: Instruction = {
    calls: [approveCall, depositCall],
    chainId: fromChain.id
  }

  return {
    userOp: userOp,
    receivedAtDestination: outputAmount,
    bridgingDurationExpectedMs: undefined
  }
}

export const AcrossPlugin: BridgingPlugin = {
  encodeBridgeUserOp: async (params) => {
    return await acrossEncodeBridgingUserOp(params)
  }
}
