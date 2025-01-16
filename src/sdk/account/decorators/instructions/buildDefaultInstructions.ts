import type { Instruction } from "../../../clients/decorators/mee"
import type { BaseInstructionsParams } from "../build"

/**
 * Parameters for building default instructions
 * @property instructions - Single {@link Instruction} or array of instructions to add
 */
export type BuildDefaultParams = {
  instructions: Instruction[] | Instruction
}

/**
 * Parameters for building base instructions
 * @property currentInstructions - Optional array of {@link Instruction} existing instructions to append to
 * @property instructions - Single {@link Instruction} or array of instructions to add
 */
export type BuildDefaultInstructionsParams = BaseInstructionsParams &
  BuildDefaultParams

/**
 * Builds a base set of instructions by combining existing instructions with new ones
 *
 * @param baseParams - {@link BaseInstructionsParams} Base configuration
 * @param baseParams.currentInstructions - Optional array of existing instructions (defaults to empty array)
 * @param params - {@link BuildDefaultInstructionsParams} Instructions configuration
 * @param params.instructions - Single instruction or array of instructions to append
 *
 * @returns Promise resolving to an array of {@link Instruction}
 *
 * @example
 * // Adding a single instruction
 * const instructions = await buildDefaultInstructions(
 *   { currentInstructions: existingInstructions },
 *   { instructions: newInstruction }
 * );
 */
export const buildDefaultInstructions = async (
  baseParams: BaseInstructionsParams,
  params: BuildDefaultParams
): Promise<Instruction[]> => {
  const { currentInstructions = [] } = baseParams
  const { instructions } = params
  return [
    ...currentInstructions,
    ...(Array.isArray(instructions) ? instructions : [instructions])
  ]
}

export default buildDefaultInstructions
