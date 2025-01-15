import type { Instruction } from "../../../clients/decorators/mee"
import type { BaseInstructionsParams } from "../build"

/**
 * Parameters for building base instructions
 * @property currentInstructions - Optional array of {@link Instruction} existing instructions to append to
 * @property instruction - Single {@link Instruction} or array of instructions to add
 */
export type BuildBaseInstructionsParams = {
  instructions: Instruction[] | Instruction
}

/**
 * Builds a base set of instructions by combining existing instructions with new ones
 *
 * @param params - {@link BuildBaseInstructionsParams} Configuration for building instructions
 * @param params.currentInstructions - Optional array of existing instructions (defaults to empty array)
 * @param params.instruction - Single instruction or array of instructions to append
 *
 * @returns Promise resolving to an array of {@link Instruction}
 *
 * @example
 * const instructions = await buildBaseInstructions({
 *   currentInstructions: existingInstructions,
 *   instruction: newInstruction
 * });
 *
 * @example
 * // With multiple new instructions
 * const instructions = await buildBaseInstructions({
 *   currentInstructions: [],
 *   instruction: [instruction1, instruction2]
 * });
 */
export const buildBaseInstructions = async (
  baseParams: BaseInstructionsParams,
  params: BuildBaseInstructionsParams
): Promise<Instruction[]> => {
  const { currentInstructions = [] } = baseParams
  const { instructions } = params
  return [
    ...currentInstructions,
    ...(Array.isArray(instructions) ? instructions : [instructions])
  ]
}

export default buildBaseInstructions
