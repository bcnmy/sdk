import type { Account, Hex, Prettify } from "viem"
import { toSigner } from "../../account/utils/toSigner.js"
import type { Module, ModuleImplementation } from "./types.js"
import { sanitizeSignature } from "../utils/Helper.js"

export type ToValidationModuleReturnType<
  implementation extends ModuleImplementation = ModuleImplementation
> = Prettify<Module<implementation>>

export async function toValidationModule<
  _implementation extends ModuleImplementation
>(
  implementation: _implementation
): Promise<ToValidationModuleReturnType<_implementation>> {
  const { client, extend, initData, deInitData, ...rest } = implementation

  if (!client.account) {
    throw new Error("Client account not found")
  }
  const signer = await toSigner({ signer: client.account as Account })

  return {
    signer,
    type: "validator",
    client,
    initData,
    deInitData,
    signUserOpHash: async (userOpHash: Hex) => {
      const signature = await signer.signMessage({
        message: { raw: userOpHash as Hex }
      })
      return signature as Hex
    },
    signMessage: async (_message: Uint8Array | string) => {
      const message =
        typeof _message === "string" ? _message : { raw: _message }
      let signature = await signer.signMessage({ message })
      return sanitizeSignature(signature)
    },
    ...extend,
    ...rest
  } as ToValidationModuleReturnType<_implementation>
}
