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
import {
  type Assign,
  type Hex,
  type Prettify,
  type PublicClient,
  decodeAbiParameters,
  encodeAbiParameters
} from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import type { Call } from "../../../account/utils/Types"
import {
  type ToValidationModuleParameters,
  toValidationModule
} from "../toValidationModule"
import type { Module, ModuleImplementation } from "../types"

type ToOwnableValidatorModuleParameters = Omit<
  ToValidationModuleParameters,
  "accountAddress"
> & {
  account: SmartAccount
  client?: PublicClient
}

export type ToOwnableValidatorModuleReturnType = Prettify<
  Module<OwnableValidatorModuleImplementation>
>

export type OwnableValidatorModuleImplementation = Assign<
  ModuleImplementation,
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

/**
 * Creates an Ownable Validator Module instance.
 * This module allows management of owners and thresholds for a Nexus account.
 *
 * @param accountAddress The address of the Nexus account.
 * @param client The client instance.
 * @param initData Initialization data for the module.
 * @param deInitData De-initialization data for the module.
 * @returns A promise that resolves to an Ownable Validator Module instance.
 *
 * @example
 * const module = await toOwnableValidatorModule({
 *   accountAddress: '0x1234...',
 *   client: nexusClient,
 *   initData: '0x...',
 *   deInitData: '0x...'
 * });
 *
 * // Use the module
 * const owners = await module.getOwners();
 * const threshold = await module.getThreshold();
 * const addOwnerTx = await module.getAddOwnerTx('0x5678...');
 */
export const toOwnableValidatorModule = (
  parameters: ToOwnableValidatorModuleParameters
): ToOwnableValidatorModuleReturnType => {
  const {
    account,
    signer,
    client = account.client as PublicClient,
    initData = encodeAbiParameters(
      [
        { name: "threshold", type: "uint256" },
        { name: "owners", type: "address[]" }
      ],
      [BigInt(1), [signer.address]]
    ),
    deInitData = "0x"
  } = parameters

  const nexusAccount = getAccount({
    address: account.address,
    type: "nexus"
  })

  return toValidationModule({
    signer,
    accountAddress: account.address,
    address: OWNABLE_VALIDATOR_ADDRESS,
    initData,
    deInitData,
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
