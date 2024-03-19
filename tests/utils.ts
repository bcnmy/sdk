import { type Hex, type PublicClient, parseAbi } from "viem"
import { getChain } from "../src/accounts/utils/helpers"
import { extractChainIdFromBundlerUrl } from "../src/bundler/utils/helpers"
import { extractChainIdFromPaymasterUrl } from "../src/paymaster/utils/helpers"

export const envCheck = () => {
  const fields = ["BUNDLER_URL", "PRIVATE_KEY", "PAYMASTER_URL", "CHAIN_ID"]
  const errorFields = fields.filter((field) => !process.env[field])
  if (errorFields.length) {
    throw new Error(
      `Missing environment variable${
        errorFields.length > 1 ? "s" : ""
      }: ${errorFields.join(", ")}`
    )
  }
}

export const getChainConfig = () => {
  const paymasterUrl = process.env.PAYMASTER_URL || ""
  const bundlerUrl = process.env.BUNDLER_URL || ""
  const chains = [Number.parseInt(process.env.CHAIN_ID || "0")]

  try {
    const chainIdFromBundlerUrl = extractChainIdFromBundlerUrl(bundlerUrl)
    chains.push(chainIdFromBundlerUrl)
  } catch (e) {}

  try {
    const chainIdFromPaymasterUrl = extractChainIdFromPaymasterUrl(paymasterUrl)
    chains.push(chainIdFromPaymasterUrl)
  } catch (e) {}

  const allChainsMatch = chains.every((chain) => chain === chains[0])

  if (!allChainsMatch) {
    console.log({ allChainsMatch, chains })
    throw new Error("Chain IDs do not match")
  }
  const chainId = chains[0]
  const chain = getChain(chainId)
  return {
    chain,
    chainId,
    paymasterUrl,
    bundlerUrl
  }
}

export const checkBalance = (
  publicClient: PublicClient,
  address: Hex,
  tokenAddress?: Hex
) => {
  if (!tokenAddress) {
    return publicClient.getBalance({ address })
  }
  return publicClient.readContract({
    address: tokenAddress,
    abi: parseAbi([
      "function balanceOf(address owner) view returns (uint balance)"
    ]),
    functionName: "balanceOf",
    // @ts-ignore
    args: [address]
  })
}
