import type { Chain } from "viem"
import type { Instruction } from "../../clients/decorators/mee/getQuote"
import type { BaseMultichainSmartAccount } from "../toMultiChainNexusAccount"
import { toAcrossPlugin } from "../utils/toAcrossPlugin"
import type {
  BridgingPlugin,
  MultichainAddressMapping
} from "./buildBridgeInstructions"

/**
 * Parameters for querying bridge operations
 * @property fromChain - {@link Chain} Source chain for the bridge operation
 * @property toChain - {@link Chain} Destination chain for the bridge operation
 * @property plugin - Optional {@link BridgingPlugin} implementation (defaults to Across)
 * @property amount - Amount to bridge in base units (wei) as BigInt
 * @property account - {@link BaseMultichainSmartAccount} Smart account to execute the bridging
 * @property tokenMapping - {@link MultichainAddressMapping} Token addresses across chains
 */
export type QueryBridgeParams = {
  /** Source chain for the bridge operation */
  fromChain: Chain
  /** Destination chain for the bridge operation */
  toChain: Chain
  /** OptionalPlugin implementation for the bridging operation */
  plugin?: BridgingPlugin
  /** Amount to bridge in base units (wei) */
  amount: bigint
  /** Multi-chain smart account configuration */
  account: BaseMultichainSmartAccount
  /** Mapping of token addresses across chains */
  tokenMapping: MultichainAddressMapping
}

/**
 * Result of a bridge query including chain info
 * @property fromChainId - ID of the source chain
 * @property amount - Amount to bridge in base units (wei) as BigInt
 * @property receivedAtDestination - Expected amount to receive at destination after fees
 * @property plugin - {@link BridgingPlugin} Plugin implementation used for the bridging operation
 * @property userOp - {@link Instruction} Resolved user operation for the bridge
 * @property bridgingDurationExpectedMs - Optional expected duration of the bridging operation in milliseconds
 */
export type BridgeQueryResult = {
  /** ID of the source chain */
  fromChainId: number
  /** Amount to bridge in base units (wei) */
  amount: bigint
  /** Expected amount to receive at destination after fees */
  receivedAtDestination: bigint
  /** Plugin implementation used for the bridging operation */
  plugin: BridgingPlugin
  /** Resolved user operation for the bridge */
  userOp: Instruction
  /** Expected duration of the bridging operation in milliseconds */
  bridgingDurationExpectedMs?: number
}

/**
 * Queries a bridge operation to determine expected outcomes and fees
 *
 * @param params - {@link QueryBridgeParams} Configuration for the bridge query
 * @param params.fromChain - Source chain for the bridge operation
 * @param params.toChain - Destination chain for the bridge operation
 * @param params.plugin - Optional bridging plugin (defaults to Across)
 * @param params.amount - Amount to bridge in base units (wei)
 * @param params.account - Smart account to execute the bridging
 * @param params.tokenMapping - Token addresses across chains
 *
 * @returns Promise resolving to {@link BridgeQueryResult} or null if received amount cannot be determined
 *
 * @throws Error if bridge plugin does not return a received amount
 *
 * @example
 * const result = await queryBridge({
 *   fromChain: optimism,
 *   toChain: base,
 *   amount: BigInt("1000000"), // 1 USDC
 *   account: myMultichainAccount,
 *   tokenMapping: {
 *     deployments: [
 *       { chainId: 10, address: "0x123..." },
 *       { chainId: 8453, address: "0x456..." }
 *     ],
 *     on: (chainId) => deployments.find(d => d.chainId === chainId).address
 *   }
 * });
 *
 * if (result) {
 *   console.log(`Expected to receive: ${result.receivedAtDestination}`);
 *   console.log(`Expected duration: ${result.bridgingDurationExpectedMs}ms`);
 * }
 */
export const queryBridge = async (
  params: QueryBridgeParams
): Promise<BridgeQueryResult | null> => {
  const {
    account,
    fromChain,
    toChain,
    plugin = toAcrossPlugin(),
    amount,
    tokenMapping
  } = params

  const result = await plugin.encodeBridgeUserOp({
    fromChain,
    toChain,
    account,
    tokenMapping,
    bridgingAmount: amount
  })

  // Skip if bridge doesn't provide received amount
  if (!result.receivedAtDestination) return null

  return {
    fromChainId: fromChain.id,
    amount,
    receivedAtDestination: result.receivedAtDestination,
    plugin,
    userOp: result.userOp,
    bridgingDurationExpectedMs: result.bridgingDurationExpectedMs
  }
}
