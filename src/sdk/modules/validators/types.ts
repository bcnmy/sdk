import type { ModuleType } from "@rhinestone/module-sdk"
import type { Assign, Client, Hex } from "viem"
import type { Signer } from "./../../account/utils/toSigner"

export type ModuleImplementation<extend extends object = object> = {
  getDummySignature: (params?: any) => Hex
  signUserOpHash: (userOpHash: Hex) => Promise<Hex>
  signMessage: (message: Uint8Array | string) => Promise<Hex>
  /** Extend the Module with custom properties. */
  extend?: extend | undefined
  client: Client
  nexusAccountAddress: Hex
  address: Hex
  initData: Hex
  deInitData: Hex
}

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
    }
  >
>

export type Transaction = {
  to: Hex
  value: bigint
  data: Hex
}
