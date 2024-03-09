import { type Hex, encodeFunctionData, parseAbi } from "viem"

import type { Prettify } from "viem/chains"
import {
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
  DEFAULT_ENTRYPOINT_ADDRESS,
  ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION
} from "../../account/utils/constants.js"
import type { SmartAccountSigner } from "../../account/utils/types.js"
import type {
  BaseValidationModule,
  ECDSAOwnershipValidationModuleConfig
} from "../utils/types.js"

/**
 * Creates an ECDSA Ownership Module.
 * @param moduleConfig - The configuration for the module.
 * @returns A promise that resolves to a BaseValidationModule.
 */
export const createECDSAOwnershipModule = async (
  moduleConfig: ECDSAOwnershipValidationModuleConfig
): Promise<Prettify<BaseValidationModule>> => {
  let moduleAddress!: Hex

  if (moduleConfig.moduleAddress) {
    moduleAddress = moduleConfig.moduleAddress
  } else if (moduleConfig.version) {
    const moduleAddr = ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION[
      moduleConfig.version
    ] as Hex
    if (!moduleAddr) {
      throw new Error(`Invalid version ${moduleConfig.version}`)
    }
    moduleAddress = moduleAddr
  } else {
    moduleAddress = DEFAULT_ECDSA_OWNERSHIP_MODULE
    // Note: in this case Version remains the default one
  }

  return {
    entryPointAddress:
      moduleConfig.entryPointAddress ?? DEFAULT_ENTRYPOINT_ADDRESS,
    /**
     * Returns the address of the module.
     * @returns {Hex} The address of the module.
     */
    getModuleAddress(): Hex {
      return moduleAddress
    },
    /**
     * Returns the signer of the smart account.
     * @returns {Promise<SmartAccountSigner>} A promise that resolves to the signer of the smart account.
     */
    async getSigner(): Promise<SmartAccountSigner> {
      return Promise.resolve(moduleConfig.signer)
    },

    /**
     * Returns a dummy signature.
     * @returns {Promise<Hex>} A promise that resolves to a dummy signature.
     */
    async getDummySignature(): Promise<Hex> {
      const dynamicPart = moduleAddress.substring(2).padEnd(40, "0")
      return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`
    },

    /**
     * Returns the initialization data for the ECDSA ownership module.
     * @returns {Promise<Hex>} A promise that resolves to the initialization data for the ECDSA ownership module.
     */
    async getInitData(): Promise<Hex> {
      const ecdsaOwnerAddress = moduleConfig.signer.address
      const moduleRegistryParsedAbi = parseAbi([
        "function initForSmartAccount(address owner)"
      ])
      const ecdsaOwnershipInitData = encodeFunctionData({
        abi: moduleRegistryParsedAbi,
        functionName: "initForSmartAccount",
        args: [ecdsaOwnerAddress]
      })
      return ecdsaOwnershipInitData
    },

    /**
     * Signs the user operation hash.
     * @param {string} userOpHash - The user operation hash to sign.
     * @returns {Promise<Hex>} A promise that resolves to the signature of the user operation hash.
     */
    async signUserOpHash(userOpHash: string): Promise<Hex> {
      const sig = await moduleConfig.signer.signMessage({ message: userOpHash })
      return sig
    },

    /**
     * Signs a message.
     * @param {Uint8Array | string} _message - The message to sign.
     * @returns {Promise<string>} A promise that resolves to the signature of the message.
     */
    async signMessage(_message: Uint8Array | string): Promise<string> {
      const message =
        typeof _message === "string" ? _message : { raw: _message }
      let signature = await moduleConfig.signer.signMessage({ message })

      const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
      if (![27, 28].includes(potentiallyIncorrectV)) {
        const correctV = potentiallyIncorrectV + 27
        signature = signature.slice(0, -2) + correctV.toString(16)
      }
      return signature
    },
    async signMessageSmartAccountSigner(
      _message: string | Uint8Array,
      signer: SmartAccountSigner
    ): Promise<string> {
      const message =
        typeof _message === "string" ? _message : { raw: _message }
      let signature: `0x${string}` = await signer.signMessage({ message })

      const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
      if (![27, 28].includes(potentiallyIncorrectV)) {
        const correctV = potentiallyIncorrectV + 27
        signature = `0x${signature.slice(0, -2) + correctV.toString(16)}`
      }

      return signature
    }
  }
}
