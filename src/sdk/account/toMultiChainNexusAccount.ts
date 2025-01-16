import { http, type Chain, type erc20Abi } from "viem"
import type { Instruction } from "../clients/decorators/mee/getQuote"
import {
  MEE_VALIDATOR_ADDRESS,
  NEXUS_ACCOUNT_FACTORY,
  TEMP_MEE_ATTESTER_ADDR
} from "../constants"
import type { MeeSmartAccount } from "../modules/utils/Types"
import { toNexusAccount } from "./toNexusAccount"
import type { Signer } from "./utils/toSigner"

import {
  type BuildInstructionTypes,
  build as buildDecorator
} from "./decorators/build"
import {
  type BridgingInstructions,
  type MultichainBridgingParams,
  buildBridgeInstructions as buildBridgeInstructionsDecorator
} from "./decorators/buildBridgeInstructions"
import {
  type UnifiedERC20Balance,
  getUnifiedERC20Balance as getUnifiedERC20BalanceDecorator
} from "./decorators/getUnifiedERC20Balance"
import {
  type BridgeQueryResult,
  type QueryBridgeParams,
  queryBridge as queryBridgeDecorator
} from "./decorators/queryBridge"
import type { MultichainToken } from "./utils/Types"
/**
 * Parameters required to create a multichain Nexus account
 */
export type MultichainNexusParams = {
  /** The signer instance used for account creation */
  signer: Signer
  /** Array of chains where the account will be deployed */
  chains: Chain[]
}

/**
 * Represents a smart account deployed across multiple chains
 */
export type BaseMultichainSmartAccount = {
  /** Array of minimal MEE smart account instances across different chains */
  deployments: MeeSmartAccount[]
  /** The signer associated with this multichain account */
  signer: Signer
  /**
   * Function to retrieve deployment information for a specific chain
   * @param chainId - The ID of the chain to query
   * @returns The smart account deployment for the specified chain
   * @throws Error if no deployment exists for the specified chain
   */
  deploymentOn: (chainId: number) => MeeSmartAccount | undefined
}

export type MultichainSmartAccount = BaseMultichainSmartAccount & {
  /**
   * Function to retrieve the unified ERC20 balance across all deployments
   * @param mcToken - The multichain token to query
   * @returns The unified ERC20 balance across all deployments
   * @example
   * const balance = await mcAccount.getUnifiedERC20Balance(mcUSDC)
   */
  getUnifiedERC20Balance: (
    mcToken: MultichainToken
  ) => Promise<UnifiedERC20Balance>
  /**
   * Function to build instructions for bridging a token across all deployments
   * @param params - The parameters for the balance requirement
   * @returns Instructions for any required bridging operations
   * @example
   * const instructions = await mcAccount.build({
   *   amount: BigInt(1000),
   *   mcToken: mcUSDC,
   *   chain: base
   * })
   */
  build: (
    params: BuildInstructionTypes,
    currentInstructions?: Instruction[]
  ) => Promise<Instruction[]>
  /**
   * Function to build instructions for bridging a token across all deployments
   * @param params - The parameters for the balance requirement
   * @returns Instructions for any required bridging operations
   * @example
   * const instructions = await mcAccount.buildBridgeInstructions({
   *   amount: BigInt(1000),
   *   mcToken: mcUSDC,
   *   chain: base
   * })
   */
  buildBridgeInstructions: (
    params: Omit<MultichainBridgingParams, "account">
  ) => Promise<BridgingInstructions>
  /**
   * Function to query the bridge
   * @param params - The parameters for the bridge query
   * @returns The bridge query result
   * @example
   * const result = await mcAccount.queryBridge({
   *   amount: BigInt(1000),
   *   mcToken: mcUSDC,
   *   chain: base
   * })
   */
  queryBridge: (params: QueryBridgeParams) => Promise<BridgeQueryResult | null>
}

/**
 * Creates a multichain Nexus account across specified chains
 *
 * @param parameters - {@link MultichainNexusParams} Configuration for multichain account creation
 * @param parameters.signer - The signer instance used for account creation
 * @param parameters.chains - Array of chains where the account will be deployed
 *
 * @returns Promise resolving to {@link MultichainSmartAccount} instance
 *
 * @throws Error if account creation fails on any chain
 *
 * @example
 * const account = await toMultichainNexusAccount({
 *   signer: mySigner,
 *   chains: [optimism, base]
 * });
 *
 * // Get deployment on specific chain
 * const optimismDeployment = account.deploymentOn(10);
 *
 * // Check token balance across chains
 * const balance = await account.getUnifiedERC20Balance(mcUSDC);
 *
 * // Build bridge transaction
 * const bridgeInstructions = await account.buildBridgeInstructions({
 *   amount: BigInt("1000000"), // 1 USDC
 *   mcToken: mcUSDC,
 *   toChain: base
 * });
 */
export async function toMultichainNexusAccount(
  parameters: MultichainNexusParams
): Promise<MultichainSmartAccount> {
  const { signer, chains } = parameters

  const deployments = await Promise.all(
    chains.map((chain) =>
      toNexusAccount({
        chain,
        signer,
        transport: http(),
        validatorAddress: MEE_VALIDATOR_ADDRESS,
        factoryAddress: NEXUS_ACCOUNT_FACTORY,
        attesters: [TEMP_MEE_ATTESTER_ADDR]
      })
    )
  )

  const deploymentOn = (chainId: number) => {
    const deployment = deployments.find(
      (dep) => dep.client.chain?.id === chainId
    )
    return deployment
  }

  const baseAccount = {
    deployments,
    signer,
    deploymentOn
  }

  const getUnifiedERC20Balance = (mcToken: MultichainToken) => {
    return getUnifiedERC20BalanceDecorator({ mcToken, account: baseAccount })
  }

  const build = (
    params: BuildInstructionTypes,
    currentInstructions?: Instruction[]
  ): Promise<Instruction[]> =>
    buildDecorator({ currentInstructions, account: baseAccount }, params)

  const buildBridgeInstructions = (
    params: Omit<MultichainBridgingParams, "account">
  ) => buildBridgeInstructionsDecorator({ ...params, account: baseAccount })

  const queryBridge = (params: QueryBridgeParams) =>
    queryBridgeDecorator({ ...params, account: baseAccount })

  return {
    ...baseAccount,
    getUnifiedERC20Balance,
    build,
    buildBridgeInstructions,
    queryBridge
  }
}
