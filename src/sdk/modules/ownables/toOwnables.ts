import {
  OWNABLE_VALIDATOR_ADDRESS,
  getAccount,
  getOwnableValidatorMockSignature,
  getOwnableValidatorThreshold,
  isModuleInstalled
} from "@rhinestone/module-sdk"
import type { Module as ModuleMeta } from "@rhinestone/module-sdk"
import {
  type Address,
  type Hex,
  type PublicClient,
  decodeAbiParameters,
  encodeAbiParameters
} from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import type { Module, ModuleParameters } from "../utils/Types"
import { type ToModuleParameters, toModule } from "../utils/toModule"

type ToOwnableModuleParameters = Omit<ToModuleParameters, "accountAddress"> & {
  account: SmartAccount
  moduleInitArgs?: GetOwnablesModuleInitDataParams
  client?: PublicClient
}

export type GetOwnablesModuleInitDataParams = {
  threshold: bigint
  owners: Address[]
}

export type OwnableModuleParameters = ModuleParameters

export const getOwnablesModuleInitData = (
  parameters: GetOwnablesModuleInitDataParams
): ModuleMeta => ({
  module: OWNABLE_VALIDATOR_ADDRESS,
  type: "validator",
  initData: encodeAbiParameters(
    [
      { name: "threshold", type: "uint256" },
      { name: "owners", type: "address[]" }
    ],
    [parameters.threshold, parameters.owners]
  )
})
export const getOwnablesInitData = (): Hex => "0x"

export const toOwnables = (parameters: ToOwnableModuleParameters): Module => {
  const {
    account,
    signer,
    client = account.client as PublicClient,
    initData = "0x",
    moduleInitArgs: moduleInitArgs_ = {
      threshold: 1,
      owners: [signer.address]
    },
    deInitData = "0x"
  } = parameters

  const nexusAccount = getAccount({
    address: account.address,
    type: "nexus"
  })

  const moduleInitData = getOwnablesModuleInitData(moduleInitArgs_)

  return toModule({
    signer,
    accountAddress: account.address,
    address: OWNABLE_VALIDATOR_ADDRESS,
    initData: getOwnablesInitData(),
    deInitData,
    moduleInitData,
    getStubSignature: async (): Promise<Hex> => {
      const isInstalled = await isModuleInstalled({
        account: nexusAccount,
        client: client as PublicClient,
        module: { module: OWNABLE_VALIDATOR_ADDRESS, type: "validator" }
      })
      let threshold: number
      if (isInstalled) {
        threshold = await getOwnableValidatorThreshold({
          account: nexusAccount,
          client: client as PublicClient
        })
      } else {
        const [_threshold, _owners] = decodeAbiParameters(
          [
            { name: "threshold", type: "uint256" },
            { name: "owners", type: "address[]" }
          ],
          initData
        )
        threshold = Number(_threshold)
      }
      return getOwnableValidatorMockSignature({ threshold })
    }
  })
}
