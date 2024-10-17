import {
  SmartSessionMode,
  encodeSmartSessionSignature
} from "@rhinestone/module-sdk"
import type { Module as ModuleMeta } from "@rhinestone/module-sdk"
import { type Address, type Hex, encodePacked } from "viem"
import addresses from "../../__contracts/addresses"
import type { ModularSmartAccount } from "../utils/Types"
import type { Module, ModuleParameters } from "../utils/Types"
import { type ToModuleParameters, toModule } from "../utils/toModule"
import type { UseSessionModuleData } from "./Types"

const DUMMY_ECDSA_SIG =
  "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c"

export type SmartSessionImplementation = ModuleParameters & {
  moduleData?: UseSessionModuleData
}

export type UseSessionModuleGetInitDataArgs = {
  signerAddress: Address
}

export type UseSessionModuleParameters = Omit<
  ToModuleParameters,
  "accountAddress"
> & {
  account: ModularSmartAccount
  moduleData?: UseSessionModuleData
}

export const getUseSessionModuleInitData = (
  _?: UseSessionModuleGetInitDataArgs
): ModuleMeta => ({
  module: addresses.SmartSession,
  type: "validator",
  initData: "0x"
})

export const getUseSessionInitData = ({
  signerAddress
}: UseSessionModuleGetInitDataArgs): Hex =>
  encodePacked(["address"], [signerAddress])

export const toSmartSessions = (
  parameters: UseSessionModuleParameters
): Module => {
  const {
    account,
    signer,
    moduleInitData: moduleInitData_,
    deInitData = "0x",
    initData: initData_,
    moduleInitArgs: moduleInitArgs_ = { signerAddress: signer.address },
    initArgs: initArgs_ = { signerAddress: signer.address },
    moduleData: {
      permissionId = "0x",
      mode = SmartSessionMode.USE,
      enableSessionData
    } = {}
  } = parameters

  const initData = initData_ ?? getUseSessionInitData(initArgs_)
  const moduleInitData =
    moduleInitData_ ?? getUseSessionModuleInitData(moduleInitArgs_)

  return toModule({
    signer,
    accountAddress: account.address,
    address: addresses.SmartSession,
    initData,
    moduleInitData,
    deInitData,
    getStubSignature: async () =>
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
