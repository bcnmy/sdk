import {
  SmartSessionMode,
  encodeSmartSessionSignature
} from "@rhinestone/module-sdk"
import { type Address, type Hex, type Prettify, encodePacked } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import addresses from "../../__contracts/addresses"
import type { GenericModule, GenericModuleParameters } from "../utils/Types"
import { type ToModuleParameters, toModule } from "../utils/toModule"
import type { UseSessionModuleData } from "./Types"

const DUMMY_ECDSA_SIG =
  "0xe8b94748580ca0b4993c9a1b86b5be851bfc076ff5ce3a1ff65bf16392acfcb800f9b4f1aef1555c7fce5599fffb17e7c635502154a0333ba21f3ae491839af51c"

export type UseSessionReturnType = Prettify<
  GenericModule<SmartSessionImplementation> & {
    getInitData: (args: UseSessionModuleGetInitDataArgs) => Hex
  }
>
export type SmartSessionImplementation = GenericModuleParameters & {
  data: UseSessionModuleData
}

export type UseSessionModuleGetInitDataArgs = {
  fieldName: "address"
  signerAddress: Address
}

export type UseSessionModuleParameters = Omit<
  ToModuleParameters,
  "accountAddress"
> & {
  initArgs?: UseSessionModuleGetInitDataArgs
  account: SmartAccount
  data: UseSessionModuleData
}

export const getInitData = ({
  fieldName,
  signerAddress
}: UseSessionModuleGetInitDataArgs) =>
  encodePacked([fieldName], [signerAddress])

export const toUseSessions = (
  parameters: UseSessionModuleParameters
): UseSessionReturnType => {
  const {
    account,
    signer,
    deInitData = "0x",
    initData: initData_,
    initArgs: initArgs_ = {
      fieldName: "address",
      signerAddress: signer.address
    },
    data,
    data: { permissionId, mode = SmartSessionMode.USE, enableSessionData }
  } = parameters

  const initData = initData_ ?? getInitData(initArgs_)

  return toModule({
    data,
    signer,
    accountAddress: account.address,
    address: addresses.SmartSession,
    initData,
    getInitData,
    deInitData,
    extend: {
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
    }
  })
}
