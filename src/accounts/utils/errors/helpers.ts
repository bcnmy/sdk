import { type Address, type Hex, getAddress } from "viem"
import type { KnownError } from "../types"

export function getAddressFromInitCodeOrPaymasterAndData(
  data: Hex
): Address | undefined {
  if (!data) {
    return undefined
  }
  if (data.length >= 42) {
    return getAddress(data.slice(0, 42))
  }
  return undefined
}

export function prettyPrint(
  args: Record<string, bigint | number | string | undefined | false | unknown>
) {
  const entries = Object.entries(args)
    .map(([key, value]) => {
      if (value === undefined || value === false) return null
      return [key, value]
    })
    .filter(Boolean) as [string, string][]
  const maxLength = entries.reduce((acc, [key]) => Math.max(acc, key.length), 0)
  return entries
    .map(([key, value]) => `  ${`${key}:`.padEnd(maxLength + 1)}  ${value}`)
    .join("\n")
}

export const buildErrorStrings = (error: KnownError): string[] =>
  [
    error.description,
    error.causes?.length
      ? ["\n", "Potential cause(s): \n", ...error.causes].join("\n")
      : "",
    error.solutions?.length
      ? ["\n", "Potential solution(s): \n", ...error.solutions].join("\n")
      : ""
  ].filter(Boolean)
