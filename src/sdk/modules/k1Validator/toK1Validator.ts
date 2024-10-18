import type { Module as ModuleMeta } from "@rhinestone/module-sdk"
import {
  type Address,
  type Hex,
  type SignableMessage,
  encodePacked
} from "viem"
import addresses from "../../__contracts/addresses"
import { sanitizeSignature } from "../utils/Helpers"
import type { Module } from "../utils/Types"
import { type ToModuleParameters, toModule } from "../utils/toModule"
export type ToK1ValidatorParameters = ToModuleParameters & {
  address?: Hex
}

export type K1ModuleGetInitDataArgs = {
  signerAddress: Address
}

export const getK1ModuleInitData = (
  _: K1ModuleGetInitDataArgs
): ModuleMeta => ({
  module: addresses.K1Validator,
  type: "validator",
  initData: "0x"
})

export const getK1InitData = ({ signerAddress }: K1ModuleGetInitDataArgs) =>
  encodePacked(["address"], [signerAddress])

/**
 * Creates a K1 Validator Module instance.
 * This module provides validation functionality using the K1 algorithm for a Nexus account.
 *
 * @param accountAddress The address of the Nexus account.
 * @param client The client instance.
 * @param initData Initialization data for the module.
 * @param deInitData De-initialization data for the module.
 * @returns A promise that resolves to a K1 Validator Module instance.
 *
 * @example
 * const module = await toK1Validator({
 *   accountAddress: '0x1234...',
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
export const toK1Validator = (parameters: ToK1ValidatorParameters): Module => {
  const {
    signer,
    initData: initData_,
    initArgs: initArgs_ = {
      signerAddress: signer.address
    },
    moduleInitArgs: moduleInitArgs_,
    moduleInitData: moduleInitData_,
    deInitData = "0x",
    accountAddress,
    address = addresses.K1Validator
  } = parameters

  const initData = initData_ ?? getK1InitData(initArgs_)
  const moduleInitData = moduleInitData_ ?? getK1ModuleInitData(moduleInitArgs_)

  return toModule({
    signer,
    address,
    accountAddress,
    initData,
    deInitData,
    moduleInitData,
    getStubSignature: async () => {
      const dynamicPart = address.substring(2).padEnd(40, "0")
      return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000` as Hex
    },
    signUserOpHash: async (userOpHash: Hex) => {
      const signature = await signer.signMessage({
        message: { raw: userOpHash as Hex }
      })
      return signature as Hex
    },
    signMessage: async (message: SignableMessage) =>
      sanitizeSignature(await signer.signMessage({ message }))
  })
}
