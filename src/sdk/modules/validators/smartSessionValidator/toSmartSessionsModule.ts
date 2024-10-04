import {
  SmartSessionMode,
  encodeSmartSessionSignature
} from "@rhinestone/module-sdk"
import { type Hex, type Prettify, encodePacked } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import addresses from "../../../__contracts/addresses"
import { sanitizeSignature } from "../../utils/Helper"
import {
  type ToValidationModuleParameters,
  toValidationModule
} from "../toValidationModule"
import type { Module, ModuleImplementation } from "../types"
import type { SmartSessionMetaData } from "./Types"

const DUMMY_ECDSA_SIG =
  "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c"

export type ToSmartSessionReturnType = Prettify<
  Module<SmartSessionImplementation>
>
export type SmartSessionImplementation = ModuleImplementation & {
  meta?: SmartSessionMetaData
}
export type ToSmartSessionsModuleParameters = Omit<
  ToValidationModuleParameters,
  "accountAddress"
> & {
  account: SmartAccount
  meta?: SmartSessionMetaData
}

export const toSmartSessionsModule = (
  parameters: ToSmartSessionsModuleParameters
): ToSmartSessionReturnType => {
  const {
    account,
    signer,
    initData = encodePacked(["address"], [signer.address]),
    deInitData = "0x",
    meta
  } = parameters

  return toValidationModule({
    signer,
    accountAddress: account.address,
    address: addresses.SmartSession,
    initData,
    deInitData,
    extend: {
      signMessage: async (_message: Uint8Array | string) => {
        const message =
          typeof _message === "string" ? _message : { raw: _message }
        const signature = await signer.signMessage({ message })
        return sanitizeSignature(signature)
      },
      signUserOpHash: async (userOpHash: Hex) => {
        if (!meta || !meta?.permissionId)
          throw new Error("You must pass a permissionId to use a session")
        const signature = await signer.signMessage({
          message: { raw: userOpHash as Hex }
        })
        return encodeSmartSessionSignature({
          mode: meta?.mode ?? SmartSessionMode.USE,
          permissionId: meta.permissionId,
          signature,
          enableSessionData: meta.enableSessionData
        })
      },
      getStubSignature: async () => {
        if (!meta || !meta?.permissionId)
          throw new Error("You must pass a permissionId to use a session")
        return encodeSmartSessionSignature({
          mode: meta?.mode ?? SmartSessionMode.USE,
          permissionId: meta.permissionId,
          signature: DUMMY_ECDSA_SIG,
          enableSessionData: meta.enableSessionData
        })
      }
    }
  })
}
