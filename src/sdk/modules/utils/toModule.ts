import type { Module as ModuleMeta } from "@rhinestone/module-sdk"
import type { Hex, SignableMessage } from "viem"
import type { Signer } from "../../account/utils/toSigner.js"
import { sanitizeSignature } from "./Helpers.js"
import type { AnyData, Module, ModuleParameters } from "./Types.js"

/**
 * Parameters for creating a module.
 */
export type ToModuleParameters = {
  /** The signer associated with the module. */
  signer: Signer
  /** The address of the account that the module is associated with. */
  accountAddress: Hex
  /** Optional initialization data for the module. */
  initData?: Hex
  /** Optional metadata for module initialization. */
  moduleInitData?: ModuleMeta
  /** Optional data for de-initializing the module. */
  deInitData?: Hex
  /** Optional arguments for module initialization. */
  moduleInitArgs?: AnyData
  /** Optional arguments for initialization. */
  initArgs?: AnyData
}

/**
 * Creates a Module object from the given implementation parameters.
 *
 * This function takes the module implementation details and constructs a standardized
 * Module object with methods for signing and generating stub signatures.
 *
 * @param implementation - The parameters defining the module implementation.
 * @returns A Module object with standardized methods and properties.
 *
 * @example
 * ```typescript
 * const myModule = toModule({
 *   accountAddress: '0x1234...',
 *   address: '0x5678...',
 *   signer: mySigner,
 *   initData: '0xabcd...',
 *   // ... other parameters
 * });
 * ```
 *
 * @remarks
 * - The returned Module object includes methods for getting stub signatures, signing user operation hashes, and signing messages.
 * - The `getStubSignature` method generates a dummy signature for testing or placeholder purposes.
 * - The `signUserOpHash` and `signMessage` methods use the provided signer to create actual signatures.
 */
export function toModule(implementation: ModuleParameters): Module {
  const {
    accountAddress,
    address,
    initData,
    deInitData,
    signer,
    moduleInitData,
    ...rest
  } = implementation

  return {
    address,
    module: address,
    accountAddress,
    moduleInitData,
    signer,
    type: "validator",
    initData,
    deInitData,
    getStubSignature: async () => {
      const dynamicPart = address.substring(2).padEnd(40, "0")
      return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000` as Hex
    },
    signUserOpHash: async (userOpHash: Hex) =>
      await signer.signMessage({
        message: { raw: userOpHash }
      }),
    signMessage: async (message: SignableMessage) =>
      sanitizeSignature(await signer.signMessage({ message })),
    ...rest
  }
}
