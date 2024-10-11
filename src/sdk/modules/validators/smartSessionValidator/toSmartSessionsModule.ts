import {
  SmartSessionMode,
  encodeSmartSessionSignature
} from "@rhinestone/module-sdk"
import { type Hex, type Prettify, encodePacked } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import addresses from "../../../__contracts/addresses"
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
  data?: SmartSessionMetaData
}
export type ToSmartSessionsModuleParameters = Omit<
  ToValidationModuleParameters,
  "accountAddress"
> & {
  account: SmartAccount
  data?: SmartSessionMetaData
}

export const toSmartSessionsModule = (
  parameters: ToSmartSessionsModuleParameters
): ToSmartSessionReturnType => {
  const {
    account,
    signer,
    initData = encodePacked(["address"], [signer.address]),
    deInitData = "0x",
    data
  } = parameters

  const isUsingSession = !!data?.permissionId

  const getSignatureForUsingSession = async (userOpHash?: Hex) => {
    if (!isUsingSession)
      throw new Error("You must pass a permissionId to use a session")
    return encodeSmartSessionSignature({
      mode: data?.mode ?? SmartSessionMode.USE,
      permissionId: data?.permissionId,
      signature: !userOpHash
        ? DUMMY_ECDSA_SIG
        : await signer.signMessage({
            message: { raw: userOpHash as Hex }
          }),
      enableSessionData: data?.enableSessionData
    })
  }

  return toValidationModule({
    data,
    signer,
    accountAddress: account.address,
    address: addresses.SmartSession,
    initData,
    deInitData,
    getStubSignature: async () => {
      const k1Signature =
        `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${addresses.K1Validator.substring(
          2
        ).padEnd(
          40,
          "0"
        )}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000` as Hex
      return isUsingSession ? getSignatureForUsingSession() : k1Signature
    },
    signUserOpHash: async (userOpHash: Hex) => {
      return isUsingSession
        ? await getSignatureForUsingSession(userOpHash)
        : await signer.signMessage({
            message: { raw: userOpHash }
          })
    }
  })
}
