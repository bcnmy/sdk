import { erc20Abi, getContract } from "viem"
import type { BaseMultichainSmartAccount } from "../toMultiChainNexusAccount"
import type { MultichainContract } from "../utils/getMultichainContract"

/**
 * Represents a balance item with its decimal precision
 */
export type UnifiedBalanceItem = {
  /** The token balance as a bigint */
  balance: bigint
  /** Number of decimal places for the token */
  decimals: number
}

export type RelevantBalance = UnifiedBalanceItem & { chainId: number }

/**
 * Represents a unified balance across multiple chains for an ERC20 token
 */
export type UnifiedERC20Balance = {
  /** The multichain ERC20 token contract */
  mcToken: MultichainContract<typeof erc20Abi>
  /** Individual balance breakdown per chain */
  breakdown: RelevantBalance[]
} & UnifiedBalanceItem

export type GetUnifiedERC20BalanceParameters = {
  /** The multichain ERC20 token contract */
  mcToken: MultichainContract<typeof erc20Abi>
  /** The multichain smart account to check balances for */
  account: BaseMultichainSmartAccount
}

/**
 * Fetches and aggregates ERC20 token balances across multiple chains for a given account
 *
 * @param parameters - The input parameters
 * @param parameters.mcToken - The multichain ERC20 token contract
 * @param parameters.deployments - The multichain smart account deployments to check balances for
 * @returns A unified balance object containing the total balance and per-chain breakdown
 * @throws Error if the account is not initialized on a chain or if token decimals mismatch across chains
 *
 * @example
 * const balance = await getUnifiedERC20Balance(client, {
 *   mcToken: mcUSDC,
 *   deployments: mcNexus.deployments
 * })
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
