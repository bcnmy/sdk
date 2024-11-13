import {
  type ByteArray,
  type Chain,
  type Client,
  type Hex,
  type Transport,
  isHex,
  pad,
  toHex
} from "viem"
import { ERROR_MESSAGES } from "../../account/index.js"
import type { AnyData, ModularSmartAccount } from "./Types.js"

/**
 * Represents a hardcoded hex value reference.
 * Used when you want to bypass automatic hex conversion.
 */
export type HardcodedReference = {
  /** The raw hex value */
  raw: Hex
}

/**
 * Base types that can be converted to hex references.
 */
type BaseReferenceValue = string | number | bigint | boolean | ByteArray

/**
 * Union type of all possible reference values that can be converted to hex.
 * Includes both basic types and hardcoded references.
 */
export type AnyReferenceValue = BaseReferenceValue | HardcodedReference

/**
 * Parses a reference value into a 32-byte hex string.
 * Handles various input types including Ethereum addresses, numbers, booleans, and raw hex values.
 *
 * @param referenceValue - The value to convert to hex
 * @returns A 32-byte hex string (66 characters including '0x' prefix)
 *
 * @throws {Error} If the resulting hex string is invalid or not 32 bytes
 */
export function parseReferenceValue(referenceValue: AnyReferenceValue): Hex {
  let result: Hex
  // Handle 20-byte Ethereum address
  if (isHex(referenceValue) && referenceValue.length === 42) {
    // Remove '0x' prefix, pad to 32 bytes (64 characters) on the left, then add '0x' prefix back
    result = `0x${"0".repeat(24)}${referenceValue.slice(2)}` as Hex
  } else if ((referenceValue as HardcodedReference)?.raw) {
    result = (referenceValue as HardcodedReference)?.raw
  } else if (typeof referenceValue === "bigint") {
    result = pad(toHex(referenceValue), { size: 32 }) as Hex
  } else if (typeof referenceValue === "number") {
    result = pad(toHex(BigInt(referenceValue)), { size: 32 }) as Hex
  } else if (typeof referenceValue === "boolean") {
    result = pad(toHex(referenceValue), { size: 32 }) as Hex
  } else if (isHex(referenceValue)) {
    // review
    result = referenceValue
  } else if (typeof referenceValue === "string") {
    result = pad(referenceValue as Hex, { size: 32 })
  } else {
    // (typeof referenceValue === "object")
    result = pad(toHex(referenceValue as ByteArray), { size: 32 }) as Hex
  }
  if (!isHex(result) || result.length !== 66) {
    throw new Error(ERROR_MESSAGES.INVALID_HEX)
  }
  return result
}

/**
 * Sanitizes an ECDSA signature by ensuring the 'v' value is either 27 or 28.
 * Also ensures the signature has a '0x' prefix.
 *
 * @param signature - The hex signature to sanitize
 * @returns A properly formatted signature with correct 'v' value
 */
export function sanitizeSignature(signature: Hex): Hex {
  let signature_ = signature
  const potentiallyIncorrectV = Number.parseInt(signature_.slice(-2), 16)
  if (![27, 28].includes(potentiallyIncorrectV)) {
    const correctV = potentiallyIncorrectV + 27
    signature_ = signature_.slice(0, -2) + correctV.toString(16)
  }
  if (signature.slice(0, 2) !== "0x") {
    signature_ = `0x${signature_}`
  }
  return signature_ as Hex
}

/**
 * Extracts and validates the active module from a client's account.
 *
 * @param client - The viem Client instance with an optional modular smart account
 * @returns The active module from the account
 *
 * @throws {Error} If no module is currently activated
 */
export const parseModule = <
  TModularSmartAccount extends ModularSmartAccount | undefined,
  chain extends Chain | undefined
>(
  client: Client<Transport, chain, TModularSmartAccount>
): AnyData => {
  const activeModule = client?.account?.getModule()
  if (!activeModule) {
    throw new Error(ERROR_MESSAGES.MODULE_NOT_ACTIVATED)
  }
  return activeModule
}
