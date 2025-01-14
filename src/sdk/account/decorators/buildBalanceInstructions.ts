import type { Chain, erc20Abi } from "viem"
import type { Instruction } from "../../clients/decorators/mee/getQuote"
import type { BaseMultichainSmartAccount } from "../toMultiChainNexusAccount"
import type { MultichainContract } from "../utils/getMultichainContract"
import buildBridgeInstructions from "./buildBridgeInstructions"
import { getUnifiedERC20Balance } from "./getUnifiedERC20Balance"

export type BuildBalanceInstructionParams = {
  /** Optional smart account to execute the transaction. If not provided, uses the client's default account */
  account: BaseMultichainSmartAccount
  /** The amount of tokens to require */
  amount: bigint
  /** The token to require */
  token: MultichainContract<typeof erc20Abi>
  /** The chain to require the token on */
  chain: Chain
}

/**
 * Makes sure that the user has enough funds on the selected chain before filling the
 * supertransaction. Bridges funds from other chains if needed.
 *
 * @param client - The Mee client to use
 * @param params - The parameters for the balance requirement
 * @returns Instructions for any required bridging operations
 * @example
 * const instructions = await buildBalanceInstruction(client, {
 *   amount: BigInt(1000),
 *   token: mcUSDC,
 *   chain: base
 * })
 */

export const buildBalanceInstructions = async (
  params: BuildBalanceInstructionParams
): Promise<Instruction[]> => {
  const { amount, token, chain, account } = params
  const unifiedBalance = await getUnifiedERC20Balance({
    mcToken: token,
    account
  })
  const { instructions } = await buildBridgeInstructions({
    account,
    amount: amount,
    toChain: chain,
    unifiedBalance
  })

  return instructions
}

export default buildBalanceInstructions
