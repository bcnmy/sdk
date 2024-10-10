import type { ModuleType } from "@rhinestone/module-sdk"
import type { Assign, Client, Hex } from "viem"
import type { Signer } from "./../../account/utils/toSigner"

/**
 * Represents the base implementation of a module.
 * @template extend - Type for extending the module with custom properties.
 */
export type ModuleImplementation<extend extends object = object> = {
  /**
   * Generates a dummy signature for testing purposes.
   * @param params - Optional parameters for generating the signature.
   * @returns A promise that resolves to a hexadecimal string representing the dummy signature.
   */
  getStubSignature: (params?: any) => Promise<Hex>
  /** Extend the Module with custom properties. */
  extend?: extend | undefined
  /** The client associated with this module. */
  client: Client
  /** The hexadecimal address of the Nexus account. */
  accountAddress: Hex
  /** The hexadecimal address of the module. */
  address: Hex
  /** Initialization data for the module. */
  initData: Hex
  /** De-initialization data for the module. */
  deInitData: Hex
}

/**
 * Represents a fully implemented module with extended functionality.
 * @template implementation - The base implementation of the module.
 */
export type Module<
  implementation extends ModuleImplementation = ModuleImplementation
> = Assign<
  implementation["extend"],
  Assign<
    implementation,
    {
      /** Signer of the Module. */
      signer: Signer
      /** Type of module. */
      type: ModuleType
      /**
       * Signs a message.
       * @param _message - The message to sign, either as a Uint8Array or string.
       * @returns A promise that resolves to a hexadecimal string representing the signature.
       */
      signMessage: (_message: Uint8Array | string) => Promise<Hex>
      /**
       * Signs a user operation hash.
       * @param userOpHash - The user operation hash to sign.
       // Review:
       * @param params - Optional parameters for generating the signature.
       * @returns A promise that resolves to a hexadecimal string representing the signature.
       */
      signUserOpHash: (userOpHash: Hex, params?: any) => Promise<Hex>
    }
  >
>

/**
 * Represents a transaction structure.
 */
export type Transaction = {
  /** The recipient address of the transaction. */
  to: Hex
  /** The value being transferred in the transaction. */
  value: bigint
  /** The data payload of the transaction. */
  data: Hex
}
