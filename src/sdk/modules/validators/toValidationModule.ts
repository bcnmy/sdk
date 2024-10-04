import type { Hex, Prettify } from "viem"
import type { Signer } from "../../account/utils/toSigner.js"
import { sanitizeSignature } from "../utils/Helper.js"
import type { Module, ModuleImplementation } from "./types.js"

export type ToValidationModuleReturnType<
  implementation extends ModuleImplementation = ModuleImplementation
> = Prettify<Module<implementation>>

export type ToValidationModuleParameters = {
  signer: Signer
  accountAddress: Hex
  initData?: Hex
  deInitData?: Hex
}

export function toValidationModule<
  _implementation extends ModuleImplementation
>(
  implementation: _implementation
): ToValidationModuleReturnType<_implementation> {
  const {
    accountAddress,
    address,
    extend,
    initData,
    deInitData,
    signer,
    ...rest
  } = implementation

  return {
    address,
    accountAddress,
    signer,
    type: "validator",
    initData,
    deInitData,
    getStubSignature: async () => {
      const dynamicPart = address.substring(2).padEnd(40, "0")
      return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000` as Hex
    },
    signUserOpHash: async (userOpHash: Hex) => {
      const signature = await signer.signMessage({
        message: { raw: userOpHash as Hex }
      })
      return signature as Hex
    },
    signMessage: async (_message: Uint8Array | string) => {
      const message =
        typeof _message === "string" ? _message : { raw: _message }
      const signature = await signer.signMessage({ message })
      return sanitizeSignature(signature)
    },
    ...extend,
    ...rest
  } as ToValidationModuleReturnType<_implementation>
}
