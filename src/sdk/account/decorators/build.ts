import type { Chain, erc20Abi } from "viem"
import type { Instruction } from "../../clients/decorators/mee/getQuote"
import type { BaseMultichainSmartAccount } from "../toMultiChainNexusAccount"
import type { MultichainContract } from "../utils/getMultichainContract"
import {
  type BuildBaseInstructionsParams,
  type BuildIntentParams,
  buildBaseInstructions,
  buildIntent
} from "./instructions"

/**
 * Base parameters for building instructions
 * @property account - {@link BaseMultichainSmartAccount} The multichain smart account to check balances for
 * @property currentInstructions - {@link Instruction[]} Optional array of existing instructions to append to
 */
export type BaseInstructionsParams = {
  /** The multichain smart account to check balances for */
  account: BaseMultichainSmartAccount
  /** The current instructions */
  currentInstructions?: Instruction[]
}

/**
 * Default build action which is used to build instructions for a chain
 */
export type BuildBaseInstruction = {
  /** The type of action */
  type: "base"
  /** The parameters for the action */
  data: BuildBaseInstructionsParams
}

/**
 * Bridge build action which is used to build instructions for bridging funds from other chains
 */
export type BuildIntentInstruction = {
  /** The type of action */
  type: "intent"
  /** The parameters for the action */
  data: BuildIntentParams
}
/**
 * The types of build instructions
 */
export type BuildInstructionTypes =
  | BuildBaseInstruction
  | BuildIntentInstruction

/**
 * Builds transaction instructions based on the provided action type and parameters
 *
 * @param params - The build instructions configuration
 * @param params.account - {@link BaseMultichainSmartAccount} The multichain smart account to check balances for
 * @param params.currentInstructions - {@link Instruction[]} Optional array of existing instructions to append to
 * @param params.type - The type of build action ("base" | "intent")
 * @param params.parameters - {@link BuildBaseInstruction} | {@link BuildIntentInstruction}
 *
 * @returns Promise resolving to an array of {@link Instruction}
 *
 * @example
 * // Bridge tokens example
 * const bridgeInstructions = await build({
 *   type: "intent",
 *   parameters: {
 *     amount: BigInt(1000),
 *     mcToken: mcUSDC,
 *     chain: base
 *   },
 *   account: myMultichainAccount
 * })
 *
 * @example
 * // Default action example
 * const defaultInstructions = await build({
 *   type: "base",
 *   parameters: myExistingInstruction,
 *   account: myMultichainAccount
 * })
 */
export const build = async (
  baseParams: BaseInstructionsParams,
  parameters: BuildInstructionTypes
): Promise<Instruction[]> => {
  const { type, data } = parameters

  switch (type) {
    case "intent": {
      return buildIntent(baseParams, data)
    }
    case "base": {
      return buildBaseInstructions(baseParams, data)
    }
    default: {
      throw new Error(`Unknown build action type: ${type}`)
    }
  }
}

export default build
