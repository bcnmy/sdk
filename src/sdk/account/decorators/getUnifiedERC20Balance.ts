import { erc20Abi, getContract } from "viem"
import type { BaseMultichainSmartAccount } from "../toMultiChainNexusAccount"
import type { MultichainToken } from "../utils/Types"
import type { MultichainContract } from "../utils/getMultichainContract"

/**
 * Represents a balance item with its decimal precision
 * @property balance - The token balance as a bigint
 * @property decimals - Number of decimal places for the token
 */
export type UnifiedBalanceItem = {
  balance: bigint
  decimals: number
}

/**
 * Represents a balance item for a specific chain
 * @property balance - The token balance as a bigint
 * @property decimals - Number of decimal places for the token
 * @property chainId - The numeric ID of the chain this balance is on
 */
export type RelevantBalance = UnifiedBalanceItem & {
  chainId: number
}

/**
 * Represents a unified balance across multiple chains for an ERC20 token
 * @property mcToken - {@link MultichainContract} The multichain ERC20 token contract
 * @property breakdown - Array of {@link RelevantBalance} Individual balance breakdown per chain
 * @property balance - The total balance across all chains as a bigint
 * @property decimals - Number of decimal places for the token
 */
export type UnifiedERC20Balance = {
  mcToken: MultichainToken
  breakdown: RelevantBalance[]
} & UnifiedBalanceItem

/**
 * Parameters for fetching unified ERC20 balance
 * @property mcToken - {@link MultichainContract} The multichain ERC20 token contract
 * @property account - {@link BaseMultichainSmartAccount} The multichain smart account to check balances for
 */
export type GetUnifiedERC20BalanceParameters = {
  mcToken: MultichainToken
  account: BaseMultichainSmartAccount
}

/**
 * Fetches and aggregates ERC20 token balances across multiple chains for a given account
 *
 * @param parameters - {@link GetUnifiedERC20BalanceParameters} Configuration for balance fetching
 * @param parameters.mcToken - The multichain ERC20 token contract
 * @param parameters.account - The multichain smart account to check balances for
 *
 * @returns Promise resolving to {@link UnifiedERC20Balance} containing total balance and per-chain breakdown
 *
 * @throws Error if token decimals mismatch across chains
 *
 * @example
 * const balance = await getUnifiedERC20Balance({
 *   mcToken: mcUSDC,
 *   account: myMultichainAccount
 * });
 *
 * console.log(`Total balance: ${balance.balance}`);
 * console.log(`Decimals: ${balance.decimals}`);
 * balance.breakdown.forEach(chainBalance => {
 *   console.log(`Chain ${chainBalance.chainId}: ${chainBalance.balance}`);
 * });
 */
export async function getUnifiedERC20Balance(
  parameters: GetUnifiedERC20BalanceParameters
): Promise<UnifiedERC20Balance> {
  const { mcToken, account: account_ } = parameters

  const relevantTokensByChain = Array.from(mcToken.deployments).filter(
    ([chainId]) => {
      return account_.deployments.some(
        (account) => account.client.chain?.id === chainId
      )
    }
  )

  const balances = await Promise.all(
    relevantTokensByChain.map(async ([chainId, address]) => {
      const account = account_.deployments.filter(
        (account) => account.client.chain?.id === chainId
      )[0]
      const tokenContract = getContract({
        abi: erc20Abi,
        address,
        client: account.client
      })
      const [balance, decimals] = await Promise.all([
        tokenContract.read.balanceOf([account.address]),
        tokenContract.read.decimals()
      ])

      return {
        balance,
        decimals,
        chainId
      }
    })
  )

  return {
    ...balances
      .map((balance) => {
        return {
          balance: balance.balance,
          decimals: balance.decimals
        }
      })
      .reduce((curr, acc) => {
        if (curr.decimals !== acc.decimals) {
          throw Error(`
          Error while trying to fetch a unified ERC20 balance. The addresses provided
          in the mapping don't have the same number of decimals across all chains. 
          The function can't fetch a unified balance for token mappings with differing 
          decimals.
        `)
        }
        return {
          balance: curr.balance + acc.balance,
          decimals: curr.decimals
        }
      }),
    breakdown: balances,
    mcToken
  }
}
