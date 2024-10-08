import {
  SmartSessionMode,
  encodeSmartSessionSignature
} from "@rhinestone/module-sdk"
import type { Account, Client, Hex, Prettify } from "viem"
import addresses from "../../../__contracts/addresses"
import { toSigner } from "../../../account"
import { sanitizeSignature } from "../../utils/Helper"
import { toValidationModule } from "../toValidationModule"
import type { Module, ModuleImplementation } from "../types"
import type { ModuleSignatureMetadata } from "./Types"

const DUMMY_ECDSA_SIG =
  "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c"

export type ToSmartSessionValidatorModuleReturnType = Prettify<
  Module<SmartSessionValidatorModuleImplementation>
>
export type SmartSessionValidatorModuleImplementation = ModuleImplementation & {
  activePermissionId: Hex
}

/**
 * Creates a Snmart Session Validator Module instance.
 * This module provides validation functionality using the session key and permissions for a Nexus account.
 *
 * @param nexusAccountAddress The address of the Nexus account.
 * @param client The nexusclient.
 * @param initData Initialization data for the module.
 * @param deInitData De-initialization data for the module.
 * @returns A promise that resolves to a Smart Session Validator Module instance.
 *
 * @example
 * const module = await toSmartSessionValidatorModule({
 *   nexusAccountAddress: '0x1234...',
 *   client: nexusClient,
 *   initData: '0x...',
 *   deInitData: '0x...'
 * });
 *
 * // Use the module
 * const dummySignature = await module.getStubSignature();
 * const userOpSignature = await module.signUserOpHash('0x...');
 * const messageSignature = await module.signMessage('Hello, world!');
 */
export const toSmartSessionValidatorModule = async ({
  nexusAccountAddress,
  initData,
  deInitData,
  client,
  activePermissionId = "0x"
}: {
  nexusAccountAddress: Hex // Review: name. this vs accountAddress
  initData: Hex
  deInitData: Hex
  client: Client
  activePermissionId: Hex
}): Promise<ToSmartSessionValidatorModuleReturnType> => {
  const signer = await toSigner({ signer: client.account as Account })

  return toValidationModule({
    address: addresses.SmartSession,
    accountAddress: nexusAccountAddress,
    initData,
    deInitData,
    activePermissionId,
    getStubSignature: async (
      moduleSignatureMetadata?: ModuleSignatureMetadata
    ) => {
      const signature = encodeSmartSessionSignature({
        mode: moduleSignatureMetadata?.mode
          ? moduleSignatureMetadata.mode
          : SmartSessionMode.USE,
        permissionId: moduleSignatureMetadata?.permissionId
          ? moduleSignatureMetadata.permissionId
          : activePermissionId,
        signature: DUMMY_ECDSA_SIG,
        enableSessionData: moduleSignatureMetadata?.enableSessionData
      }) as Hex
      return signature
    },
    signUserOpHash: async (
      userOpHash: Hex,
      moduleSignatureMetadata?: ModuleSignatureMetadata
    ) => {
      const signature = await signer.signMessage({
        message: { raw: userOpHash as Hex }
      })
      const moduleSignature = encodeSmartSessionSignature({
        mode: moduleSignatureMetadata?.mode
          ? moduleSignatureMetadata.mode
          : SmartSessionMode.USE,
        permissionId: moduleSignatureMetadata?.permissionId
          ? moduleSignatureMetadata.permissionId
          : activePermissionId,
        signature: signature,
        enableSessionData: moduleSignatureMetadata?.enableSessionData
      }) as Hex
      return moduleSignature
    },
    signMessage: async (_message: Uint8Array | string) => {
      const message =
        typeof _message === "string" ? _message : { raw: _message }
      const signature = await signer.signMessage({ message })
      return sanitizeSignature(signature)
    },
    client
  })
}
