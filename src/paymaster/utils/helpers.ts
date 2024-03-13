/**
 * Extracts the chain ID from a paymaster URL.
 * @param url - The bundler URL.
 * @returns The extracted chain ID.
 * @throws Error if the chain ID cannot be extracted or is invalid.
 */
export const extractChainIdFromPaymasterUrl = (url: string): number => {
  try {
    const regex = /\/api\/v\d+\/(\d+)\//
    const match = regex.exec(url)
    if (!match) {
      throw new Error("Invalid URL format")
    }
    return Number.parseInt(match[1])
  } catch (error) {
    throw new Error("Invalid chain id")
  }
}
