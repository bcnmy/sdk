import { type Address, type Hex, type LocalAccount } from "viem"

import { type SmartAccountSigner } from "../../common/index.js"

export type BaseValidationModuleConfig = {
  /** entryPointAddress: address of the entry point */
  entryPointAddress?: Hex
}

export type ModuleInfo = {
  version: 1
}

export type ModuleVersion = "V1_0_0"

export type IValidationModule = {
  getModuleAddress(): Hex
  getInitData(): Promise<Hex>
  getSigner(): Promise<SmartAccountSigner>
  signUserOpHash(_userOpHash: string): Promise<Hex>
  signMessage(_message: string | Uint8Array): Promise<string>
  getDummySignature(): Promise<Hex>
}

export type BaseValidationModule = IValidationModule & {
  entryPointAddress: Hex
  getModuleAddress(): Hex
  getInitData(): Promise<Hex>
  getDummySignature(_params?: ModuleInfo): Promise<Hex>
  getSigner(): Promise<SmartAccountSigner>
  signUserOpHash(_userOpHash: string, _params?: ModuleInfo): Promise<Hex>
  signMessage(_message: Uint8Array | string): Promise<string>
  signMessageSmartAccountSigner(
    message: string | Uint8Array,
    signer: LocalAccount
  ): Promise<string>
}

/**
 * Interface for implementing a Session Validation Module.
 * Session Validation Modules works along with SessionKeyManager
 * and generate module specific sessionKeyData which is to be
 * verified by SessionValidationModule on chain.
 *
 * @remarks sessionData is of generic type T which is specific to the module
 *
 * @author Sachin Tomar <sachin.tomar@biconomy.io>
 */
export type ISessionValidationModule<T> = {
  getSessionKeyData(_sessionData: T): Promise<string>
  getAddress(): string
}

export type ECDSAOwnershipValidationModuleConfig =
  BaseValidationModuleConfig & {
    /** Address of the module */
    moduleAddress?: Hex
    /** Version of the module */
    version?: ModuleVersion
    /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
    signer: SmartAccountSigner
    entryPointAddress?: Address
  }
