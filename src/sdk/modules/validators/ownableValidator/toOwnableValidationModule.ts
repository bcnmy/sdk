import { getOwnableValidatorMockSignature } from "@rhinestone/module-sdk"
import type { Account, Client, Hex, Prettify } from "viem"
import { toSigner } from "../../../account"
import { toValidationModule } from "../toValidationModule"
import type { Module, ModuleImplementation } from "../types"

export type ToOwnableValidatorModuleReturnType = Prettify<
  Module<OwnableValidatorModuleImplementation>
>

export type OwnableValidatorModuleImplementation = ModuleImplementation

export const toOwnableValidatorModule = async ({
  address,
  client,
  initData,
  deInitData,
  threshold
}: {
  address: Hex
  initData: Hex
  deInitData: Hex
  client: Client
  threshold: number
}): Promise<ToOwnableValidatorModuleReturnType> => {
  const signer = await toSigner({ signer: client.account as Account })
  return toValidationModule({
    signer,
    address,
    initData,
    deInitData,
    getDummySignature: () => {
      return getOwnableValidatorMockSignature({ threshold })
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
      let signature = await signer.signMessage({ message })

      const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
      if (![27, 28].includes(potentiallyIncorrectV)) {
        const correctV = potentiallyIncorrectV + 27
        signature = signature.slice(0, -2) + correctV.toString(16)
      }
      if (signature.slice(0, 2) !== "0x") {
        signature = `0x${signature}`
      }
      return signature as Hex
    },
    client,
    type: "validator"
  })
}
