import { toHex } from "viem"
import type { AnyData } from "../../modules/utils/Types"

/**
 * Recursively converts all BigInt and BigNumber values in an object or array to hexadecimal strings
 *
 * @param obj - {@link AnyData} The input object or value to convert
 * @returns {@link AnyData} The converted object or value with all BigInts and BigNumbers as hex strings
 *
 * @remarks
 * - Functions are converted to undefined
 * - Null, strings, and booleans remain unchanged
 * - BigInts and BigNumbers are converted to hex strings
 * - Arrays are processed recursively
 * - Objects are processed recursively with their keys preserved
 *
 * @example
 * // Converting simple values
 * deepHexlify(BigInt(123)); // returns "0x7b"
 * deepHexlify("hello"); // returns "hello"
 *
 * @example
 * // Converting complex objects
 * const result = deepHexlify({
 *   amount: BigInt(1000000),
 *   token: "0x123...",
 *   values: [BigInt(1), BigInt(2)],
 *   nested: {
 *     balance: BigInt(500)
 *   }
 * });
 * // Returns:
 * // {
 * //   amount: "0xf4240",
 * //   token: "0x123...",
 * //   values: ["0x1", "0x2"],
 * //   nested: {
 * //     balance: "0x1f4"
 * //   }
 * // }
 */
export function deepHexlify(obj: AnyData): AnyData {
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
