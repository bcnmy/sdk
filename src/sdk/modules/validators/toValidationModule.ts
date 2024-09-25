import type { Account, Hex, Prettify } from "viem"
import { toSigner } from "../../account/utils/toSigner.js"
import type { Module, ModuleImplementation } from "./types.js"

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

      const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
      if (![27, 28].includes(potentiallyIncorrectV)) {
        const correctV = potentiallyIncorrectV + 27
        signature = signature.slice(0, -2) + correctV.toString(16)
      }
      if (signature.slice(0, 2) !== "0x") {
        signature = `0x${signature}`
      }
      return signature as Hex
    },
    ...extend,
    ...rest
  } as ToValidationModuleReturnType<_implementation>
}
