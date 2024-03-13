import { type Hex, type PublicClient, parseAbi } from "viem"

export const envCheck = () => {
  const fields = ["BUNDLER_URL", "PRIVATE_KEY", "PAYMASTER_URL"]
  const errorFields = fields.filter((field) => !process.env[field])
  if (errorFields.length) {
    throw new Error(
      `Missing environment variable${
        errorFields.length > 1 ? "s" : ""
      }: ${errorFields.join(", ")}`
    )
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
