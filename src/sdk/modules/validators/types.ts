import type { ModuleType } from "@rhinestone/module-sdk"
import type { Assign, Hex } from "viem"
import type { Signer } from "./../../account/utils/toSigner"

/**
 * Represents the base implementation of a module.
 * @template extend - Type for extending the module with custom properties.
 */
export type ModuleImplementation<extend extends object = object> = {
  /** The hexadecimal address of the module. */
  address: Hex
  /** Initialization data for the module. */
  initData: Hex
  /** De-initialization data for the module. */
  deInitData: Hex
  /** Signer of the Module. */
  signer: Signer
  /** The smart account address */
  accountAddress: Hex
  /** Extend the Module with custom properties. */
  extend?: extend | undefined
  /** metadata associated with the module */
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  meta?: Record<string, any>
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
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      getStubSignature: (params?: any) => Promise<Hex>
    }
  >
>
