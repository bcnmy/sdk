import type { Address, Chain, Prettify } from "viem"
import type { Instruction } from "../../clients/decorators/mee/getQuote"
import type { BaseMultichainSmartAccount } from "../toMultiChainNexusAccount"
import { toAcrossPlugin } from "../utils/toAcrossPlugin"
import type { UnifiedERC20Balance } from "./getUnifiedERC20Balance"
import type { BridgeQueryResult } from "./queryBridge"
import { queryBridge } from "./queryBridge"

/**
 * Mapping of a token address to a specific chain
 * @property chainId - The numeric ID of the chain
 * @property address - {@link Address} The token's contract address on the chain
 */
export type AddressMapping = Prettify<{
  /** The numeric ID of the chain */
  chainId: number
  /** The token's contract address on the chain */
  address: Address
}>

/**
 * Cross-chain token address mapping with helper functions
 * @property deployments - Array of {@link AddressMapping} containing token addresses per chain
 * @property on - Function to retrieve token address for a specific chain ID
 */
export type MultichainAddressMapping = Prettify<{
  /** Array of {@link AddressMapping} containing token addresses per chain */
  deployments: AddressMapping[]
  /** Returns the token address for a given chain ID */
  on: (chainId: number) => Address
}>

/**
 * Fee data for the transaction fee
 * @property txFeeChainId - The chain ID where the tx fee is paid
 * @property txFeeAmount - The amount of tx fee to pay
 */
export type FeeData = {
  /** The chain ID where the tx fee is paid */
  txFeeChainId: number
  /** The amount of tx fee to pay */
  txFeeAmount: bigint
}

/**
 * Parameters for multichain token bridging operations
 * @property toChain - {@link Chain} Destination chain for the bridge operation
 * @property unifiedBalance - {@link UnifiedERC20Balance} Token balance information across all chains
 * @property amount - Amount of tokens to bridge as BigInt
 * @property bridgingPlugins - Optional array of {@link BridgingPlugin} to use for bridging
 * @property feeData - Optional fee information for the transaction
 */
export type MultichainBridgingParams = Prettify<{
  toChain: Chain
  unifiedBalance: UnifiedERC20Balance
  amount: bigint
  bridgingPlugins?: BridgingPlugin[]
  feeData?: FeeData
}>

/**
 * Result of a bridging plugin operation
 * @property userOp - {@link Instruction} User operation to execute the bridge
 * @property receivedAtDestination - Expected amount to be received after bridging
 * @property bridgingDurationExpectedMs - Expected duration of the bridging operation
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
 * @property fromChain - {@link Chain} Source chain for the bridge
 * @property toChain - {@link Chain} Destination chain for the bridge
 * @property account - {@link BaseMultichainSmartAccount} Smart account to execute the bridging
 * @property tokenMapping - {@link MultichainAddressMapping} Token addresses across chains
 * @property bridgingAmount - Amount to bridge as BigInt
 */
export type BridgingUserOpParams = Prettify<{
  fromChain: Chain
  toChain: Chain
  account: BaseMultichainSmartAccount
  tokenMapping: MultichainAddressMapping
  bridgingAmount: bigint
}>

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
 * @param params - Configuration for the bridge operation
 * @param params.account - {@link BaseMultichainSmartAccount} The smart account to execute the bridging
 * @param params.amount - The amount to bridge as BigInt
 * @param params.toChain - {@link Chain} The destination chain
 * @param params.unifiedBalance - {@link UnifiedERC20Balance} Current token balances across chains
 * @param params.bridgingPlugins - Optional array of {@link BridgingPlugin} to use (defaults to Across)
 * @param params.feeData - Optional fee configuration for the transaction
 *
 * @returns Promise resolving to {@link BridgingInstructions} containing all necessary operations
 *
 * @throws Error if insufficient balance is available for bridging
 * @throws Error if chain configuration is missing for any deployment
 *
 * @example
 * const bridgeInstructions = await buildBridgeInstructions({
 *   account: myMultichainAccount,
 *   amount: BigInt("1000000"), // 1 USDC
 *   toChain: optimism,
 *   unifiedBalance: myTokenBalance,
 *   bridgingPlugins: [acrossPlugin],
 *   feeData: {
 *     txFeeChainId: 1,
 *     txFeeAmount: BigInt("100000")
 *   }
 * });
 */
export const buildBridgeInstructions = async (
  params: BuildBridgeInstructionParams
): Promise<BridgingInstructions> => {
  const {
    account,
    amount: targetAmount,
    toChain,
    unifiedBalance,
    bridgingPlugins = [toAcrossPlugin()],
    feeData
  } = params

  // Create token address mapping
  const tokenMapping: MultichainAddressMapping = {
    on: (chainId: number) =>
      unifiedBalance.mcToken.deployments.get(chainId) || "0x",
    deployments: Array.from(
      unifiedBalance.mcToken.deployments.entries(),
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
