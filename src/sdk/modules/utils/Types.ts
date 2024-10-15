import type { Address, Assign, Chain, Hex, SignableMessage } from "viem"
import type { Signer } from "./../../account/utils/toSigner"

export type ModuleVersion = "1.0.0" // | 'V1_0_1'

export type SignerData = {
  /** This is not the public as provided by viem, key but address for the given pvKey */
  pbKey: Hex
  /** Private key */
  pvKey: Hex
}

export type ChainInfo = number | Chain

export type CreateSessionDataResponse = {
  data: string
  sessionIDInfo: Array<string>
}

export type Execution = {
  target: Address
  value: bigint
  callData: Hex
}

export enum SafeHookType {
  GLOBAL = 0,
  SIG = 1
}

export type ModuleType = "validator" | "executor" | "fallback" | "hook"

type ModuleTypeIds = {
  [index in ModuleType]: 1 | 2 | 3 | 4
}

export const moduleTypeIds: ModuleTypeIds = {
  validator: 1,
  executor: 2,
  fallback: 3,
  hook: 4
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type AnyData = any
/**
 * Represents the base implementation of a module.
 * @template extend - Type for extending the module with custom properties.
 */
export type GenericModuleParameters<extend extends object = object> = {
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
  /** data associated with the module */
  data?: Record<string, AnyData>
  /** Args passed to call initData */
  getInitData: (args?: AnyData) => Hex
  /** Args passed to getInitData */
  initArgs?: AnyData
}

/**
 * Represents a fully implemented module with extended functionality.
 * @template implementation - The base implementation of the module.
 */
export type GenericModule<
  implementation extends GenericModuleParameters = GenericModuleParameters
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
       * @param message - The message to sign, either as a Uint8Array or string.
       * @returns A promise that resolves to a hexadecimal string representing the signature.
       */
      signMessage: (message: SignableMessage) => Promise<Hex>
      /**
       * Signs a user operation hash.
       * @param userOpHash - The user operation hash to sign.
       // Review:
       * @param params - Optional parameters for generating the signature.
       * @returns A promise that resolves to a hexadecimal string representing the signature.
       */
      signUserOpHash: (userOpHash: Hex) => Promise<Hex>
      /**
       * Gets the stub signature of the module.
       */
      getStubSignature: () => Promise<Hex>
      /** For retrieving module data. */
      getData: () => Record<string, AnyData>
      /** For setting module data. */
      setData: (data: Record<string, AnyData>) => void
      /** For compatibility with module-sdk. */
      module: Hex
    }
  >
>
