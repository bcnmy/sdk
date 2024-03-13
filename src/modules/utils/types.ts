import type { Address, Hex, LocalAccount } from "viem"

import type { SmartAccountSigner } from "../../accounts/utils/types.js"

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

/**
 * Represents a base validation module.
 */
export type BaseValidationModule = IValidationModule & {
  /**
   * The entry point address.
   */
  entryPointAddress: Hex

  /**
   * Retrieves the module address.
   * @returns The module address.
   */
  getModuleAddress(): Hex

  /**
   * Retrieves the initialization data.
   * @returns A promise that resolves to the initialization data.
   */
  getInitData(): Promise<Hex>

  /**
   * Retrieves a dummy signature.
   * @param _params - The module information.
   * @returns A promise that resolves to the dummy signature.
   */
  getDummySignature(_params?: ModuleInfo): Promise<Hex>

  /**
   * Retrieves the signer.
   * @returns A promise that resolves to the smart account signer.
   */
  getSigner(): Promise<SmartAccountSigner>

  /**
   * Signs a user operation hash.
   * @param _userOpHash - The user operation hash.
   * @param _params - The module information.
   * @returns A promise that resolves to the signature.
   */
  signUserOpHash(_userOpHash: string, _params?: ModuleInfo): Promise<Hex>

  /**
   * Signs a message.
   * @param _message - The message to sign.
   * @returns A promise that resolves to the signature.
   */
  signMessage(_message: Uint8Array | string): Promise<string>

  /**
   * Signs a message using a smart account signer.
   * @param message - The message to sign.
   * @param signer - The local account signer.
   * @returns A promise that resolves to the signature.
   */
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
    /** entryPointAddress: address of the entry point contract */
    entryPointAddress?: Address
  }
