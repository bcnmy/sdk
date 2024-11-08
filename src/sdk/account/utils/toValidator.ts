import type { Address } from "viem"
import type { AnyData } from "../../modules/utils/Types.js"

/**
 * Represents the minimum interface required for a validator implementation.
 * Provides methods for validating signatures and transactions.
 */
export type MinimalValidator = {
  /** The validator's address */
  address: Address | string
  /** Optional provider instance */
  provider?: AnyData
  /**
   * Validates a signature against a message
   * @param message - The message that was signed
   * @param signature - The signature to validate
   */
  isValidSignature?: (message: AnyData, signature: AnyData) => Promise<AnyData>
  /**
   * Validates a typed data signature (EIP-712)
   * @param hash - The hash of the typed data
   * @param signature - The signature to validate
   */
  isValidTypedSignature?: (
    hash: AnyData,
    signature: AnyData
  ) => Promise<AnyData>
  /** Allows for additional properties */
  [key: string]: AnyData
}

/**
 * Union type of various validator implementations.
 * Currently only supports MinimalValidator, but can be extended for future implementations.
 */
export type UnknownValidator = MinimalValidator

/**
 * Converts various validator types into a standardized validator format.
 * Currently handles MinimalValidator implementations, but can be extended for other types.
 *
 * @param validator - The validator to convert
 * @param address - Optional address to use for the validator
 * @returns A Promise resolving to a MinimalValidator
 *
 * @throws {Error} When address is required but not provided
 */
export async function toValidator({
  validator,
  address
}: {
  validator: UnknownValidator
  address?: Address
}): Promise<MinimalValidator> {
  if (!validator.address && !address) {
    throw new Error("Address is required")
  }

  return {
    ...validator,
    address: address || validator.address
  }
}
