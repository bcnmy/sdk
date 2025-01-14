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
 * @param client - MEE client instance
 * @param params - Bridge query parameters
 * @returns Bridge query result or null if received amount cannot be determined
 * @throws Error if bridge plugin does not return a received amount
 *
 * @example
 * const result = await queryBridge({
 *   fromChain,
 *   toChain,
 *   plugin,
 *   amount,
 *   account,
 *   tokenMapping
 * })
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
