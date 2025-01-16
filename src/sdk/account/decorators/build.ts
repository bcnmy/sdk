import type { Instruction } from "../../clients/decorators/mee/getQuote"
import type { BaseMultichainSmartAccount } from "../toMultiChainNexusAccount"
import {
  type BuildDefaultInstructionsParams,
  buildDefaultInstructions
} from "./instructions/buildDefaultInstructions"
import {
  type BuildIntentParameters,
  buildIntent
} from "./instructions/buildIntent"

/**
 * Base parameters for building instructions
 * @property account - {@link BaseMultichainSmartAccount} The multichain smart account to check balances for
 * @property currentInstructions - {@link Instruction[]} Optional array of existing instructions to append to
 */
export type BaseInstructionsParams = {
  account: BaseMultichainSmartAccount
  currentInstructions?: Instruction[]
}

/**
 * Default build action which is used to build instructions for a chain
 * @property type - Literal "default" to identify the action type
 * @property data - {@link BuildDefaultInstructionsParams} The parameters for the action
 */
export type BuildDefaultInstruction = {
  type: "default"
  data: BuildDefaultInstructionsParams
}

/**
 * Bridge build action which is used to build instructions for bridging funds from other chains
 * @property type - Literal "intent" to identify the action type
 * @property data - {@link BuildIntentParams} The parameters for the bridge action
 */
export type BuildIntentInstruction = {
  type: "intent"
  data: BuildIntentParameters
}

/**
 * Union type of all possible build instruction types
 */
export type BuildInstructionTypes =
  | BuildDefaultInstruction
  | BuildIntentInstruction

/**
 * Builds transaction instructions based on the provided action type and parameters
 *
 * @param baseParams - {@link BaseInstructionsParams} Base configuration for instructions
 * @param baseParams.account - The multichain smart account to check balances for
 * @param baseParams.currentInstructions - Optional array of existing instructions to append to
 * @param parameters - {@link BuildInstructionTypes} The build action configuration
 * @param parameters.type - The type of build action ("default" | "intent")
 * @param parameters.data - Action-specific parameters based on the type
 *
 * @returns Promise resolving to an array of {@link Instruction}
 *
 * @example
 * // Bridge tokens example
 * const bridgeInstructions = await build(
 *   { account: myMultichainAccount },
 *   {
 *     type: "intent",
 *     data: {
 *       amount: BigInt(1000000),
 *       mcToken: mcUSDC,
 *       chain: optimism
 *     }
 *   }
 * );
 *
 * @example
 * // Default action example
 * const defaultInstructions = await build(
 *   { account: myMultichainAccount },
 *   {
 *     type: "default",
 *     data: {
 *       instructions: myExistingInstruction
 *     }
 *   }
 * );
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
    case "default": {
      return buildDefaultInstructions(baseParams, data)
    }
    default: {
      throw new Error(`Unknown build action type: ${type}`)
    }
  }
}

export default build
