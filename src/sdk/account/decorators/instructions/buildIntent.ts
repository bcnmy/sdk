import type { Chain, erc20Abi } from "viem"
import type { Instruction } from "../../../clients/decorators/mee"
import type { BaseMultichainSmartAccount } from "../../toMultiChainNexusAccount"
import type { MultichainToken } from "../../utils/Types"
import type { MultichainContract } from "../../utils/getMultichainContract"
import type { BaseInstructionsParams } from "../build"
import buildBridgeInstructions from "../buildBridgeInstructions"
import { getUnifiedERC20Balance } from "../getUnifiedERC20Balance"

/**
 * Parameters for building bridge intent instructions
 * @property amount - Amount of tokens to bridge as BigInt
 * @property mcToken - {@link MultichainContract} The multichain token contract to bridge
 * @property chain - {@link Chain} The destination chain for the bridge operation
 */
export type BuildIntentParameters = {
  amount: bigint
  mcToken: MultichainToken
  chain: Chain
}

/**
 * Parameters for building bridge intent instructions
 * @property account - {@link BaseMultichainSmartAccount} The smart account to execute the bridging
 * @property currentInstructions - Array of {@link Instruction} existing instructions to append to
 * @property parameters - {@link BuildIntentParameters} The parameters for building the bridge intent
 */
export type BuildIntentParams = BaseInstructionsParams & {
  parameters: BuildIntentParameters
}

/**
 * Builds bridge intent instructions by checking unified token balance and creating necessary bridge operations
 *
 * @param baseParams - {@link BaseInstructionsParams} Base configuration
 * @param baseParams.account - {@link BaseMultichainSmartAccount} The smart account to execute the bridging
 * @param baseParams.currentInstructions - Array of existing instructions to append to
 * @param parameters - {@link BuildIntentParameters} Bridge configuration
 * @param parameters.amount - The amount to bridge
 * @param parameters.mcToken - The multichain token contract
 * @param parameters.chain - The destination chain
 *
 * @returns Promise resolving to an array of {@link Instruction}
 *
 * @example
 * const bridgeIntentInstructions = await buildIntent(
 *   {
 *     account: myMultichainAccount,
 *     currentInstructions: []
 *   },
 *   {
 *     amount: BigInt("1000000"), // 1 USDC
 *     mcToken: mcUSDC,
 *     chain: optimism
 *   }
 * );
 */
export const buildIntent = async (
  baseParams: BaseInstructionsParams,
  parameters: BuildIntentParameters
): Promise<Instruction[]> => {
  const { account, currentInstructions = [] } = baseParams
  const { amount, mcToken, chain } = parameters
  const unifiedBalance = await getUnifiedERC20Balance({ mcToken, account })
  const { instructions } = await buildBridgeInstructions({
    account,
    amount: amount,
    toChain: chain,
    unifiedBalance
  })
  return [...currentInstructions, ...instructions]
}

export default buildIntent
