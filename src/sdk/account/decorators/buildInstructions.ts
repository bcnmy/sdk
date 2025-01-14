import type { Chain, erc20Abi } from "viem"
import type { Instruction } from "../../clients/decorators/mee/getQuote"
import type { BaseMultichainSmartAccount } from "../toMultiChainNexusAccount"
import type { MultichainContract } from "../utils/getMultichainContract"
import buildBridgeInstructions from "./buildBridgeInstructions"
import { getUnifiedERC20Balance } from "./getUnifiedERC20Balance"

export type BridgeInstructionsForBridgeAction = {
  /** The amount of tokens to require */
  amount: bigint
  /** The token to require */
  mcToken: MultichainContract<typeof erc20Abi>
  /** The chain to require the token on */
  chain: Chain
}

/**
 * Parameters for querying bridge operations
 */
export type BuildInstructionsParams = {
  /** The multichain smart account to check balances for */
  account: BaseMultichainSmartAccount
  /** The chain to build instructions for */
  action: DefaultBuildAction | BridgeBuildAction
  /** The current instructions */
  currentInstructions?: Instruction[]
}

type DefaultBuildAction = {
  type: "DEFAULT"
  parameters: Instruction[] | Instruction
}

type BridgeBuildAction = {
  type: "BRIDGE"
  parameters: BridgeInstructionsForBridgeAction
}

/**
 * Makes sure that the user has enough funds on the selected chain before filling the
 * supertransaction. Bridges funds from other chains if needed.
 *
 * @param client - The Mee client to use
 * @param params - The parameters for the balance requirement
 * @returns Instructions for any required bridging operations
 * @example
 * const instructions = await buildInstructions(client, {
 *   amount: BigInt(1000),
 *   mcToken: mcUSDC,
 *   chain: base
 * })
 */

export const buildInstructions = async (
  params: BuildInstructionsParams
): Promise<Instruction[]> => {
  const { account, action, currentInstructions = [] } = params

  switch (action.type) {
    case "BRIDGE": {
      const { amount, mcToken, chain } = action.parameters
      const unifiedBalance = await getUnifiedERC20Balance({ mcToken, account })
      const { instructions } = await buildBridgeInstructions({
        account,
        amount: amount,
        toChain: chain,
        unifiedBalance
      })
      return [...currentInstructions, ...instructions]
    }
    default:
      return Array.isArray(action.parameters)
        ? [...currentInstructions, ...action.parameters]
        : [...currentInstructions, action.parameters]
  }
}

export default buildInstructions
