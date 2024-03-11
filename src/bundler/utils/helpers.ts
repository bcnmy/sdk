/**
 * Extracts the chain ID from a bundler URL.
 * @param url - The bundler URL.
 * @returns The extracted chain ID.
 * @throws Error if the chain ID cannot be extracted or is invalid.
 */
export const extractChainIdFromBundlerUrl = (url: string): number => {
  try {
    const regex = /\/api\/v2\/(\d+)\/[a-zA-Z0-9.-]+$/
    const match = regex.exec(url)
    if (!match) {
      throw new Error("No match")
    }
    return Number.parseInt(match[1])
  } catch (error) {
    throw new Error("Invalid chain id")
  }
}
