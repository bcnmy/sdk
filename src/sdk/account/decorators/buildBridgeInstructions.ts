import type { Address, Chain } from "viem"
import type { Instruction } from "../../clients/decorators/mee/getQuote"
import type { BaseMultichainSmartAccount } from "../toMultiChainNexusAccount"
import { AcrossPlugin } from "../utils/acrossPlugin"
import type { UnifiedERC20Balance } from "./getUnifiedERC20Balance"
import type { BridgeQueryResult } from "./queryBridge"
import { queryBridge } from "./queryBridge"

/**
 * Mapping of a token address to a specific chain
 */
export type AddressMapping = {
  chainId: number
  address: Address
}

/**
 * Cross-chain token address mapping with helper functions
 */
export type MultichainAddressMapping = {
  deployments: AddressMapping[]
  /** Returns the token address for a given chain ID */
  on: (chainId: number) => Address
}

/**
 * Parameters for multichain token bridging operations
 */
export type MultichainBridgingParams = {
  /** Destination chain for the bridge operation */
  toChain: Chain
  /** Unified token balance across all chains */
  unifiedBalance: UnifiedERC20Balance
  /** Amount to bridge */
  amount: bigint
  /** Plugins to use for bridging */
  bridgingPlugins?: BridgingPlugin[]
  /** FeeData for the tx fee */
  feeData?: {
    /** Chain ID where the tx fee is paid */
    txFeeChainId: number
    /** Amount of tx fee to pay */
    txFeeAmount: bigint
  }
}

/**
 * Result of a bridging plugin operation
 */
export type BridgingPluginResult = {
  /** User operation to execute the bridge */
  userOp: Instruction
  /** Expected amount to be received at destination */
  receivedAtDestination?: bigint
  /** Expected duration of the bridging operation in milliseconds */
  bridgingDurationExpectedMs?: number
}

/**
 * Parameters for generating a bridge user operation
 */
export type BridgingUserOpParams = {
  /** Source chain for the bridge */
  fromChain: Chain
  /** Destination chain for the bridge */
  toChain: Chain
  /** Smart account to execute the bridging */
  account: BaseMultichainSmartAccount
  /** Token addresses across chains */
  tokenMapping: MultichainAddressMapping
  /** Amount to bridge */
  bridgingAmount: bigint
}

/**
 * Interface for a bridging plugin implementation
 */
export type BridgingPlugin = {
  /** Generates a user operation for bridging tokens */
  encodeBridgeUserOp: (
    params: BridgingUserOpParams
  ) => Promise<BridgingPluginResult>
}

export type BuildBridgeInstructionParams = MultichainBridgingParams & {
  /** Smart account to execute the bridging */
  account: BaseMultichainSmartAccount
}

/**
 * Single bridge operation result
 */
export type BridgingInstruction = {
  /** User operation to execute */
  userOp: Instruction
  /** Expected amount to be received at destination */
  receivedAtDestination?: bigint
  /** Expected duration of the bridging operation */
  bridgingDurationExpectedMs?: number
}

/**
 * Complete set of bridging instructions and final outcome
 */
export type BridgingInstructions = {
  /** Array of bridging operations to execute */
  instructions: Instruction[]
  /** Meta information about the bridging process */
  meta: {
    /** Total amount that will be available on destination chain */
    totalAvailableOnDestination: bigint
    /** Array of bridging operations to execute */
    bridgingInstructions: BridgingInstruction[]
  }
}

/**
 * Makes sure that the user has enough funds on the selected chain before filling the
 * supertransaction. Bridges funds from other chains if needed.
 *
 * @param client - The Mee client to use
 * @param params - The parameters for the Bridge requirement
 * @returns Instructions for any required bridging operations
 * @example
 * const instructions = await buildBridgeInstruction(client, {
 *   amount: BigInt(1000),
 *   token: mcUSDC,
 *   chain: base
 * })
 */

export const buildBridgeInstructions = async (
  params: BuildBridgeInstructionParams
): Promise<BridgingInstructions> => {
  const {
    account,
    amount: targetAmount,
    toChain,
    unifiedBalance,
    bridgingPlugins = [AcrossPlugin],
    feeData
  } = params

  // Create token address mapping
  const tokenMapping: MultichainAddressMapping = {
    on: (chainId: number) =>
      unifiedBalance.token.deployments.get(chainId) || "0x",
    deployments: Array.from(
      unifiedBalance.token.deployments.entries(),
      ([chainId, address]) => ({
        chainId,
        address
      })
    )
  }

  // Get current balance on destination chain
  const destinationBalance =
    unifiedBalance.breakdown.find((b) => b.chainId === toChain.id)?.balance ||
    0n

  // If we have enough on destination, no bridging needed
  if (destinationBalance >= targetAmount) {
    return {
      instructions: [],
      meta: {
        bridgingInstructions: [],
        totalAvailableOnDestination: destinationBalance
      }
    }
  }

  // Calculate how much we need to bridge
  const amountToBridge = targetAmount - destinationBalance

  // Get available balances from source chains
  const sourceBalances = unifiedBalance.breakdown
    .filter((balance) => balance.chainId !== toChain.id)
    .map((balance) => {
      // If this is the fee payment chain, adjust available balance
      const isFeeChain = feeData && feeData.txFeeChainId === balance.chainId

      const availableBalance =
        isFeeChain && "txFeeAmount" in feeData
          ? balance.balance > feeData.txFeeAmount
            ? balance.balance - feeData.txFeeAmount
            : 0n
          : balance.balance

      return {
        chainId: balance.chainId,
        balance: availableBalance
      }
    })
    .filter((balance) => balance.balance > 0n)

  // Get chain configurations
  const chains = Object.fromEntries(
    account.deployments.map((deployment) => {
      const chain = deployment.client.chain
      if (!chain) {
        throw new Error(
          `Client not configured with chain for deployment at ${deployment.address}`
        )
      }
      return [chain.id, chain] as const
    })
  )

  // Query all possible routes
  const bridgeQueries = sourceBalances.flatMap((source) => {
    const fromChain = chains[source.chainId]
    if (!fromChain) return []

    return bridgingPlugins.map((plugin) =>
      queryBridge({
        fromChain,
        toChain,
        plugin,
        amount: source.balance,
        account,
        tokenMapping
      })
    )
  })

  const bridgeResults = (await Promise.all(bridgeQueries))
    .filter((result): result is BridgeQueryResult => result !== null)
    // Sort by received amount relative to sent amount
    .sort(
      (a, b) =>
        Number((b.receivedAtDestination * 10000n) / b.amount) -
        Number((a.receivedAtDestination * 10000n) / a.amount)
    )

  // Build instructions by taking from best routes until we have enough
  const bridgingInstructions: BridgingInstruction[] = []
  const instructions: Instruction[] = []
  let totalBridged = 0n
  let remainingNeeded = amountToBridge

  for (const result of bridgeResults) {
    if (remainingNeeded <= 0n) break

    const amountToTake =
      result.amount >= remainingNeeded ? remainingNeeded : result.amount

    // Recalculate received amount based on portion taken
    const receivedFromRoute =
      (result.receivedAtDestination * amountToTake) / result.amount

    instructions.push(result.userOp)
    bridgingInstructions.push({
      userOp: result.userOp,
      receivedAtDestination: receivedFromRoute,
      bridgingDurationExpectedMs: result.bridgingDurationExpectedMs
    })

    totalBridged += receivedFromRoute
    remainingNeeded -= amountToTake
  }

  // Check if we got enough
  if (remainingNeeded > 0n) {
    throw new Error(
      `Insufficient balance for bridging:
         Required: ${targetAmount.toString()}
         Available to bridge: ${totalBridged.toString()}
         Shortfall: ${remainingNeeded.toString()}`
    )
  }

  return {
    instructions,
    meta: {
      bridgingInstructions,
      totalAvailableOnDestination: destinationBalance + totalBridged
    }
  }
}

export default buildBridgeInstructions
