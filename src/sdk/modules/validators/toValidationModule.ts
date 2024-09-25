import type { Account, Prettify } from "viem"
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
    ...extend,
    ...rest
  } as ToValidationModuleReturnType<_implementation>
}
