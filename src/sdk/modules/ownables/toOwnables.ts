import {
  type Execution,
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
import type { Module as ModuleMeta } from "@rhinestone/module-sdk"
import {
  type Address,
  type Assign,
  type Hex,
  type Prettify,
  type PublicClient,
  decodeAbiParameters,
  encodeAbiParameters
} from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import type { Call } from "../../account/utils/Types"
import type { GenericModule, GenericModuleParameters } from "../utils/Types"
import { type ToModuleParameters, toModule } from "../utils/toModule"
type ToOwnableModuleParameters = Omit<ToModuleParameters, "accountAddress"> & {
  account: SmartAccount
  initArgs?: OwnablesModuleGetInitDataArgs
  client?: PublicClient
}

export type OwnableModule = Prettify<
  GenericModule<OwnableModuleParameters> & {
    getInitData: (args: OwnablesModuleGetInitDataArgs) => Hex
  }
>

export type OwnablesModuleGetInitDataArgs = {
  threshold: bigint
  owners: Address[]
}

export type OwnableModuleParameters = Assign<
  GenericModuleParameters,
  {
    /**
     * Retrieves the list of owners for the Ownable Validator.
     * @returns A promise that resolves to an array of owner addresses.
     * @example
     * const owners = await module.getOwners();
     * console.log(owners); // ['0x1234...', '0x5678...']
     */
    getOwners: () => Promise<Hex[]>

    /**
     * Retrieves the current threshold for the Ownable Validator.
     * @returns A promise that resolves to the current threshold number.
     * @example
     * const threshold = await module.getThreshold();
     * console.log(threshold); // 2
     */
    getThreshold: () => Promise<number>

    /**
     * Generates a transaction to add a new owner to the Ownable Validator.
     * @param owner The address of the new owner to add.
     * @returns A promise that resolves to a Call object.
     * @example
     * const tx = await module.getAddOwnerTx('0x1234...');
     * console.log(tx); // { to: '0x...', value: 0n, data: '0x...' }
     */
    getAddOwnerTx: (owner: Hex) => Promise<Call>

    /**
     * Generates a transaction to remove an owner from the Ownable Validator.
     * @param owner The address of the owner to remove.
     * @returns A promise that resolves to a Call object.
     * @example
     * const tx = await module.getRemoveOwnerTx('0x1234...');
     * console.log(tx); // { to: '0x...', value: 0n, data: '0x...' }
     */
    getRemoveOwnerTx: (owner: Hex) => Promise<Call>

    /**
     * Generates a transaction to set a new threshold for the Ownable Validator.
     * @param threshold The new threshold value to set.
     * @returns A Call object.
     * @example
     * const tx = module.getSetThresholdTx(3);
     * console.log(tx); // { to: '0x...', value: 0n, data: '0x...' }
     */
    getSetThresholdTx: (threshold: number) => Call
  }
>

export const getInitData = ({
  threshold,
  owners
}: OwnablesModuleGetInitDataArgs) =>
  encodeAbiParameters(
    [
      { name: "threshold", type: "uint256" },
      { name: "owners", type: "address[]" }
    ],
    [threshold, owners]
  )

export const OWNABLE_MODULE_META: ModuleMeta = {
  type: "validator",
  module: OWNABLE_VALIDATOR_ADDRESS
}

export const toOwnables = (
  parameters: ToOwnableModuleParameters
): OwnableModule => {
  const {
    account,
    signer,
    client = account.client as PublicClient,
    initData: initData_,
    initArgs: initArgs_ = { threshold: 1, owners: [signer.address] },
    deInitData = "0x"
  } = parameters

  const nexusAccount = getAccount({
    address: account.address,
    type: "nexus"
  })

  const initData = initData_ ?? getInitData(initArgs_)

  return toModule({
    signer,
    accountAddress: account.address,
    address: OWNABLE_VALIDATOR_ADDRESS,
    initData,
    deInitData,
    getInitData,
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
    },
    extend: {
      getAddOwnerTx: async (owner: Hex): Promise<Call> => {
        const action = (await getAddOwnableValidatorOwnerAction({
          account: nexusAccount,
          client,
          owner
        })) as Execution
        return {
          to: action.target,
          value: BigInt(action.value.toString()),
          data: action.callData
        }
      },
      getRemoveOwnerTx: async (owner: Hex): Promise<Call> => {
        const action = (await getRemoveOwnableValidatorOwnerAction({
          account: nexusAccount,
          client: client as PublicClient,
          owner
        })) as Execution
        return {
          to: action.target,
          value: BigInt(action.value.toString()),
          data: action.callData
        }
      },
      getSetThresholdTx: (threshold: number): Call => {
        const action = getSetOwnableValidatorThresholdAction({ threshold })
        return {
          to: action.target,
          value: BigInt(action.value.toString()),
          data: action.callData
        }
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
    }
  })
}
