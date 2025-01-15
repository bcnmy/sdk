import { http, type Chain, type erc20Abi } from "viem"
import type { Instruction } from "../clients/decorators/mee/getQuote"
import {
  MEE_VALIDATOR_ADDRESS,
  NEXUS_ACCOUNT_FACTORY,
  TEMP_MEE_ATTESTER_ADDR
} from "../constants"
import type { MeeSmartAccount } from "../modules/utils/Types"
import { toNexusAccount } from "./toNexusAccount"
import type { MultichainContract } from "./utils/getMultichainContract"
import type { Signer } from "./utils/toSigner"

import {
  type BuildInstructionTypes,
  build as buildDecorator
} from "./decorators/build"
import {
  type BridgingInstructions,
  type BuildBridgeInstructionParams,
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
    mcToken: MultichainContract<typeof erc20Abi>
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
    params: Omit<BuildBridgeInstructionParams, "account">
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
 * @param parameters - Configuration parameters for multichain account creation
 * @returns Promise resolving to a MultichainSmartAccount instance
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

  const getUnifiedERC20Balance = (
    mcToken: MultichainContract<typeof erc20Abi>
  ) => {
    return getUnifiedERC20BalanceDecorator({ mcToken, account: baseAccount })
  }

  const build = (
    params: BuildInstructionTypes,
    currentInstructions?: Instruction[]
  ): Promise<Instruction[]> =>
    buildDecorator({ currentInstructions, account: baseAccount }, params)

  const buildBridgeInstructions = (
    params: Omit<BuildBridgeInstructionParams, "account">
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
