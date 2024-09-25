import type { Account, Client, Hex, Prettify } from "viem"
import addresses from "../../../__contracts/addresses"
import { toSigner } from "../../../account"
import { toValidationModule } from "../toValidationModule"
import type { Module, ModuleImplementation } from "../types"

export type ToK1ValidatorModuleReturnType = Prettify<
  Module<K1ValidatorModuleImplementation>
>

export type K1ValidatorModuleImplementation = ModuleImplementation

export const toK1ValidatorModule = async ({
  nexusAccountAddress,
  client,
  initData,
  deInitData
}: {
  nexusAccountAddress: Hex
  initData: Hex
  deInitData: Hex
  client: Client
}): Promise<ToK1ValidatorModuleReturnType> => {
  const signer = await toSigner({ signer: client.account as Account })
  return toValidationModule({
    address: addresses.K1Validator,
    nexusAccountAddress,
    initData,
    deInitData,
    getDummySignature: () => {
      const dynamicPart = addresses.K1Validator.substring(2).padEnd(40, "0")
      return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`
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
    client
  })
}
