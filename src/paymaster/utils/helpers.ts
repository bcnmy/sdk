import { toHex } from "viem"

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

export function deepHexlify(obj: any): any {
  if (typeof obj === "function") {
    return undefined
  }
  if (obj == null || typeof obj === "string" || typeof obj === "boolean") {
    return obj
  }

  if (typeof obj === "bigint") {
    return toHex(obj)
  }

  if (obj._isBigNumber != null || typeof obj !== "object") {
    return toHex(obj).replace(/^0x0/, "0x")
  }
  if (Array.isArray(obj)) {
    return obj.map((member) => deepHexlify(member))
  }
  return Object.keys(obj).reduce(
    // biome-ignore lint/suspicious/noExplicitAny: it's a recursive function, so it's hard to type
    (set: any, key: string) => {
      set[key] = deepHexlify(obj[key])
      return set
    },
    {}
  )
}

export const getTimestampInSeconds = (): number => {
  return Math.floor(Date.now() / 1000)
}
