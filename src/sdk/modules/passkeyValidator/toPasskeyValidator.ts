import { startAuthentication } from "@simplewebauthn/browser"
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/typescript-types"
import {
  type Address,
  type Assign,
  type Client,
  type Hex,
  type SignableMessage,
  encodeAbiParameters
} from "viem"
import type { UserOperation } from "viem/account-abstraction"
import { type ModuleParameters, toModule } from ".."
import type { Signer } from "../../account"
import { passkeyValidatorAddress } from "../../constants"
import type { Module } from "../utils/Types"
import type { WebAuthnKey } from "./toWebAuthnKey"
import {
  b64ToBytes,
  base64FromUint8Array,
  findQuoteIndices,
  hexStringToUint8Array,
  isRIP7212SupportedNetwork,
  parseAndNormalizeSig,
  uint8ArrayToHexString
} from "./utils"

const signMessageUsingWebAuthn = async (
  message: SignableMessage,
  chainId: number,
  allowCredentials?: PublicKeyCredentialRequestOptionsJSON["allowCredentials"]
) => {
  let messageContent: string
  console.warn("In passkey validator signMessageUsingWebAuthn")
  console.log(
    {
      message,
      chainId,
      allowCredentials
    },
    "signMessageUsingWebAuthn"
  )

  if (typeof message === "string") {
    // message is a string
    messageContent = message
  } else if ("raw" in message && typeof message.raw === "string") {
    // message.raw is a Hex string
    messageContent = message.raw
  } else if ("raw" in message && message.raw instanceof Uint8Array) {
    // message.raw is a ByteArray
    messageContent = message.raw.toString()
  } else {
    throw new Error("Unsupported message format")
  }

  // remove 0x prefix if present
  const formattedMessage = messageContent.startsWith("0x")
    ? messageContent.slice(2)
    : messageContent

  const challenge = base64FromUint8Array(
    hexStringToUint8Array(formattedMessage),
    true
  )

  // prepare assertion options
  const assertionOptions: PublicKeyCredentialRequestOptionsJSON = {
    challenge,
    allowCredentials,
    userVerification: "required"
  }

  // start authentication (signing)

  const cred = await startAuthentication(assertionOptions)

  // get authenticator data
  const { authenticatorData } = cred.response
  const authenticatorDataHex = uint8ArrayToHexString(
    b64ToBytes(authenticatorData)
  )

  // get client data JSON
  const clientDataJSON = atob(cred.response.clientDataJSON)
  console.log(clientDataJSON, "clientDataJSON")

  // get challenge and response type location
  const { beforeType } = findQuoteIndices(clientDataJSON)

  // get signature r,s
  const { signature } = cred.response
  const signatureHex = uint8ArrayToHexString(b64ToBytes(signature))
  const { r, s } = parseAndNormalizeSig(signatureHex)

  // encode signature
  console.log(
    [
      authenticatorDataHex,
      clientDataJSON,
      beforeType,
      BigInt(r),
      BigInt(s),
      isRIP7212SupportedNetwork(chainId)
    ],
    "Webatuh Signature Data"
  )

  const encodedSignature = encodeAbiParameters(
    [
      { name: "authenticatorData", type: "bytes" },
      { name: "clientDataJSON", type: "string" },
      { name: "responseTypeLocation", type: "uint256" },
      { name: "r", type: "uint256" },
      { name: "s", type: "uint256" },
      { name: "usePrecompiled", type: "bool" }
    ],
    [
      authenticatorDataHex,
      clientDataJSON,
      beforeType,
      BigInt(r),
      BigInt(s),
      isRIP7212SupportedNetwork(chainId)
    ]
  )
  return encodedSignature
}

export type ModuleImplementation<extend extends object = object> = {
  /**
   * Generates a dummy signature for testing purposes.
   * @param params - Optional parameters for generating the signature.
   * @returns A promise that resolves to a hexadecimal string representing the dummy signature.
   */
  getStubSignature: (params?: any) => Promise<Hex>
  /** Extend the Module with custom properties. */
  extend?: extend | undefined
  /** The client associated with this module. */
  client: Client
  /** The hexadecimal address of the Nexus account. */
  accountAddress: Hex
  /** The hexadecimal address of the module. */
  address: Hex
  /** Initialization data for the module. */
  initData: Hex
  /** De-initialization data for the module. */
  deInitData: Hex
  getSerializedData: () => string
}

export type PasskeyValidatorModuleImplementation = Assign<
  ModuleParameters,
  {
    getNonceKey: (
      accountAddress?: Address,
      customNonceKey?: bigint
    ) => Promise<bigint>
    signUserOperation: (userOperation: UserOperation) => Promise<Hex>
    getSerializedData: () => string
  }
>

export async function toPasskeyValidator({
  webAuthnKey,
  signer,
  accountAddress,
  chainId
}: {
  webAuthnKey: WebAuthnKey
  signer: Signer
  accountAddress: Hex
  chainId: number
}): Promise<Module> {
  console.warn("In passkey validator !", { color: "yellow" })

  return toModule({
    signer,
    address: passkeyValidatorAddress,
    accountAddress: accountAddress,
    signUserOpHash: async (userOpHash: `0x${string}`) => {
      console.warn("In passkey validator signUserOpHash", { color: "green" })
      return signMessageUsingWebAuthn(userOpHash, chainId, [
        { id: webAuthnKey.authenticatorId, type: "public-key" }
      ])
    },
    initData: encodeAbiParameters(
      [
        {
          components: [
            { name: "x", type: "uint256" },
            { name: "y", type: "uint256" }
          ],
          name: "webAuthnData",
          type: "tuple"
        },
        {
          name: "authenticatorIdHash",
          type: "bytes32"
        }
      ],
      [
        {
          x: webAuthnKey.pubX,
          y: webAuthnKey.pubY
        },
        webAuthnKey.authenticatorIdHash
      ]
    ),
    moduleInitData: {
      initData: encodeAbiParameters(
        [
          {
            components: [
              { name: "x", type: "uint256" },
              { name: "y", type: "uint256" }
            ],
            name: "webAuthnData",
            type: "tuple"
          },
          {
            name: "authenticatorIdHash",
            type: "bytes32"
          }
        ],
        [
          {
            x: webAuthnKey.pubX,
            y: webAuthnKey.pubY
          },
          webAuthnKey.authenticatorIdHash
        ]
      ),
      address: passkeyValidatorAddress,
      type: "validator"
    },
    deInitData: "0x", // Add this line, adjust if needed
    async getStubSignature() {
      console.warn("Getting stub signature from passkey validator !", {
        color: "green"
      })
      return encodeAbiParameters(
        [
          { name: "authenticatorData", type: "bytes" },
          { name: "clientDataJSON", type: "string" },
          { name: "responseTypeLocation", type: "uint256" },
          { name: "r", type: "uint256" },
          { name: "s", type: "uint256" },
          { name: "usePrecompiled", type: "bool" }
        ],
        [
          "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d00000000",
          '{"type":"webauthn.get","challenge":"tbxXNFS9X_4Byr1cMwqKrIGB-_30a0QhZ6y7ucM0BOE","origin":"http://localhost:3000","crossOrigin":false, "other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"}',
          1n,
          44941127272049826721201904734628716258498742255959991581049806490182030242267n,
          9910254599581058084911561569808925251374718953855182016200087235935345969636n,
          false
        ]
      )
    }
  })
}
