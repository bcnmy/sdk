import type { Hex, SignableMessage } from "viem"
import { sanitizeSignature } from "./Helpers.js"
import type { Module, ModuleParameters } from "./Types.js"

/**
 * Creates a Module object from the given parameters parameters.
 *
 * This function takes the module parameters details and constructs a standardized
 * Module object with methods for signing and generating stub signatures.
 *
 * @param parameters - The parameters defining the module parameters.
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
export function toModule(parameters: ModuleParameters): Module {
  const {
    account,
    extend,
    initArgs = {},
    deInitData = "0x",
    initData = "0x",
    moduleInitArgs = "0x",
    accountAddress = account?.address ?? "0x",
    moduleInitData = {
      address: "0x",
      type: "validator"
    },
    ...rest
  } = parameters

  let data_ = parameters.data ?? {}
  const setData = (d: Record<string, unknown>) => {
    data_ = d
  }
  const getData = () => data_

  return {
    ...parameters,
    initData,
    moduleInitData,
    moduleInitArgs,
    deInitData,
    accountAddress,
    initArgs,
    setData,
    getData,
    module: parameters.address,
    type: "validator",
    getStubSignature: async () => {
      const dynamicPart = parameters.address.substring(2).padEnd(40, "0")
      return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000` as Hex
    },
    signUserOpHash: async (userOpHash: Hex) =>
      await parameters.signer.signMessage({
        message: { raw: userOpHash }
      }),
    signMessage: async (message: SignableMessage) =>
      sanitizeSignature(await parameters.signer.signMessage({ message })),
    ...extend,
    ...rest
  }
}
