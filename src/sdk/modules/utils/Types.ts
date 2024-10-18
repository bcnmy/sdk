import type { Address, Chain, Hex, SignableMessage } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
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

export type ModuleActions = {
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
}

export type ModuleParameters = {
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
  /** The module initData */
  moduleInitData: ModuleMeta
  /** The module initArgs */
  moduleInitArgs?: AnyData
  /** The initArgs for initData */
  initArgs?: AnyData
} & Partial<ModuleActions>

export type Module = ModuleParameters &
  ModuleActions & {
    /** For compatibility with module-sdk. */
    module: Hex
    /** Signer of the Module. */
    signer: Signer
    /** Type of module. */
    type: ModuleType
  }

export type Modularity = {
  getModule: () => Module | undefined
  setModule: (module: Module) => void
}

export type ModularSmartAccount = SmartAccount & Modularity

export type ModuleMeta = {
  address: Hex
  type: ModuleType
  initData?: Hex
}
