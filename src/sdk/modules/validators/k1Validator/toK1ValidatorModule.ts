import { type Hex, type Prettify, encodePacked } from "viem"
import addresses from "../../../__contracts/addresses"
import { sanitizeSignature } from "../../utils/Helper"
import {
  type ToValidationModuleParameters,
  toValidationModule
} from "../toValidationModule"
import type { Module, ModuleImplementation } from "../types"

export type ToK1ValidatorModuleParameters = ToValidationModuleParameters & {
  address?: Hex
}

export type ToK1ValidatorModuleReturnType = Prettify<
  Module<K1ValidatorModuleImplementation>
>

export type K1ValidatorModuleImplementation = ModuleImplementation & {
  signUserOpHash: (userOpHash: Hex) => Promise<Hex>
  getStubSignature: () => Promise<Hex>
}

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
 * const module = await toK1ValidatorModule({
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
export const toK1ValidatorModule = async (
  parameters: ToK1ValidatorModuleParameters
): Promise<ToK1ValidatorModuleReturnType> => {
  const {
    signer,
    initData = encodePacked(["address"], [signer.address]),
    deInitData = "0x",
    accountAddress,
    address = addresses.K1Validator
  } = parameters

  return toValidationModule({
    signer,
    address,
    accountAddress,
    initData,
    deInitData,
    extend: {
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
      signMessage: async (_message: Uint8Array | string) => {
        const message =
          typeof _message === "string" ? _message : { raw: _message }
        const signature = await signer.signMessage({ message })
        return sanitizeSignature(signature)
      }
    }
  })
}
