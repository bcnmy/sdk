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
import type { UseSessionModuleData } from "./Types"

const DUMMY_ECDSA_SIG =
  "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c"

export type ToUseSessionReturnType = Prettify<
  Module<SmartSessionImplementation>
>
export type SmartSessionImplementation = ModuleImplementation & {
  data: UseSessionModuleData
}
export type ToUseSessionModuleParameters = Omit<
  ToValidationModuleParameters,
  "accountAddress"
> & {
  account: SmartAccount
  data: UseSessionModuleData
}

export const toUseSessionModule = (
  parameters: ToUseSessionModuleParameters
): ToUseSessionReturnType => {
  const {
    account,
    signer,
    initData = encodePacked(["address"], [signer.address]),
    deInitData = "0x",
    data,
    data: { permissionId, mode = SmartSessionMode.USE, enableSessionData }
  } = parameters

  return toValidationModule({
    data,
    signer,
    accountAddress: account.address,
    address: addresses.SmartSession,
    initData,
    deInitData,
    getStubSignature: () =>
      encodeSmartSessionSignature({
        mode,
        permissionId,
        enableSessionData,
        signature: DUMMY_ECDSA_SIG
      }),
    signUserOpHash: async (userOpHash: Hex) =>
      encodeSmartSessionSignature({
        mode,
        permissionId,
        enableSessionData,
        signature: await signer.signMessage({
          message: { raw: userOpHash as Hex }
        })
      })
  })
}
