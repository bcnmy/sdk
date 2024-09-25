import {
  OWNABLE_VALIDATOR_ADDRESS,
  getAccount,
  getAddOwnableValidatorOwnerAction,
  getOwnableValidatorMockSignature,
  getOwnableValidatorOwners,
  getOwnableValidatorThreshold,
  getRemoveOwnableValidatorOwnerAction,
  getSetOwnableValidatorThresholdAction,
  isModuleInstalled
} from "@rhinestone/module-sdk"
import {
  type Account,
  type Assign,
  type Client,
  type Hex,
  type Prettify,
  type PublicClient,
  decodeAbiParameters
} from "viem"
import { toSigner } from "../../../account"
import { toValidationModule } from "../toValidationModule"
import type { Module, ModuleImplementation, Transaction } from "../types"

export type ToOwnableValidatorModuleReturnType = Prettify<
  Module<OwnableValidatorModuleImplementation>
>

export type OwnableValidatorModuleImplementation = Assign<
  ModuleImplementation,
  {
    getOwners: () => Promise<Hex[]>
    getThreshold: () => Promise<number>
    getAddOwnerTx: (owner: Hex) => Promise<Transaction>
    getRemoveOwnerTx: (owner: Hex) => Promise<Transaction>
    getSetThresholdTx: (threshold: number) => Transaction
  }
>

export const toOwnableValidatorModule = async ({
  nexusAccountAddress,
  client,
  initData,
  deInitData
}: {
  nexusAccountAddress: Hex
  initData: Hex
  deInitData: Hex
  client: Client
}): Promise<ToOwnableValidatorModuleReturnType> => {
  const signer = await toSigner({ signer: client.account as Account })
  const nexusAccount = getAccount({
    address: nexusAccountAddress,
    type: "nexus"
  })
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

  return toValidationModule({
    signer,
    nexusAccountAddress,
    address: OWNABLE_VALIDATOR_ADDRESS,
    initData,
    deInitData,
    getAddOwnerTx: async (owner: Hex): Promise<Transaction> => {
      const action = await getAddOwnableValidatorOwnerAction({
        account: nexusAccount,
        client: client as PublicClient,
        owner
      })
      if ("callData" in action) {
        return {
          to: action.target,
          value: BigInt(action.value.toString()),
          data: action.callData
        }
      }
      return {
        to: "0x0",
        value: 0n,
        data: "0x"
      }
    },
    getRemoveOwnerTx: async (owner: Hex): Promise<Transaction> => {
      const action = await getRemoveOwnableValidatorOwnerAction({
        account: nexusAccount,
        client: client as PublicClient,
        owner
      })
      if ("callData" in action) {
        return {
          to: action.target,
          value: BigInt(action.value.toString()),
          data: action.callData
        }
      }
      return {
        to: "0x0",
        value: 0n,
        data: "0x"
      }
    },
    getSetThresholdTx: (threshold: number): Transaction => {
      const action = getSetOwnableValidatorThresholdAction({ threshold })
      return {
        to: action.target,
        value: BigInt(action.value.toString()),
        data: action.callData
      }
    },
    getDummySignature: () => {
      return getOwnableValidatorMockSignature({ threshold })
    },
    getOwners: async (): Promise<Hex[]> => {
      return await getOwnableValidatorOwners({
        account: nexusAccount,
        client: client as PublicClient
      })
    },
    getThreshold: async (): Promise<number> => {
      return await getOwnableValidatorThreshold({
        account: nexusAccount,
        client: client as PublicClient
      })
    },
    client,
    type: "validator"
  })
}
