import type { Module as ModuleMeta } from "@rhinestone/module-sdk"
import type { Hex, SignableMessage } from "viem"
import type { Signer } from "../../account/utils/toSigner.js"
import { sanitizeSignature } from "./Helpers.js"
import type { AnyData, Module, ModuleParameters } from "./Types.js"

export type ToModuleParameters = {
  signer: Signer
  accountAddress: Hex
  initData?: Hex
  moduleInitData?: ModuleMeta
  deInitData?: Hex
  moduleInitArgs?: AnyData
  initArgs?: AnyData
}

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
