import { startAuthentication } from "@simplewebauthn/browser"
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/typescript-types"
import {
  type Account,
  type Address,
  type Assign,
  type Client,
  type Hex,
  type LocalAccount,
  type Prettify,
  type SignTypedDataParameters,
  type SignableMessage,
  type TypedData,
  type TypedDataDefinition,
  encodeAbiParameters,
  getTypesForEIP712Domain,
  hashTypedData,
  validateTypedData
} from "viem"
import {
  type UserOperation,
  entryPoint07Address,
  getUserOperationHash
} from "viem/account-abstraction"
import { toAccount } from "viem/accounts"
import { getChainId, signMessage } from "viem/actions"
import { sanitizeSignature } from "../.."
import { toSigner } from "../../../account"
import type { Module, ModuleImplementation } from "../types"
import type { WebAuthnKey } from "./toWebAuthnKey"
import {
  b64ToBytes,
  base64FromUint8Array,
  deserializePasskeyValidatorData,
  findQuoteIndices,
  hexStringToUint8Array,
  isRIP7212SupportedNetwork,
  parseAndNormalizeSig,
  serializePasskeyValidatorData,
  uint8ArrayToHexString
} from "./utils"

const signMessageUsingWebAuthn = async (
  message: SignableMessage,
  chainId: number,
  allowCredentials?: PublicKeyCredentialRequestOptionsJSON["allowCredentials"]
) => {
  let messageContent: string
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

  // get challenge and response type location
  const { beforeType } = findQuoteIndices(clientDataJSON)

  // get signature r,s
  const { signature } = cred.response
  const signatureHex = uint8ArrayToHexString(b64ToBytes(signature))
  const { r, s } = parseAndNormalizeSig(signatureHex)

  // encode signature
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

export enum PasskeyValidatorContractVersion {
  V0_0_1 = "0.0.1",
  V0_0_2 = "0.0.2" // this version is only supported by kernel versions "0.3.0 || 0.3.1"
}

export type PasskeyValidatorModuleImplementation = Assign<
  ModuleImplementation,
  {
    getNonceKey: (
      accountAddress?: Address,
      customNonceKey?: bigint
    ) => Promise<bigint>
    signUserOperation: (userOperation: UserOperation) => Promise<Hex>
    getSerializedData: () => string
  }
>

export type ToPasskeyValidatorModuleReturnType = Prettify<
  Module<PasskeyValidatorModuleImplementation>
>

export async function toPasskeyValidator(
  client: Client,
  {
    webAuthnKey
  }: {
    webAuthnKey: WebAuthnKey
  }
): Promise<ToPasskeyValidatorModuleReturnType> {
  const signer = await toSigner({ signer: client.account as Account })
  const validatorAddress = "0xD990393C670dCcE8b4d8F858FB98c9912dBFAa06"
  // Fetch chain id
  const chainId = await getChainId(client)

  const account: LocalAccount = toAccount({
    // note that this address will be overwritten by actual address
    address: "0x0000000000000000000000000000000000000000",
    async signMessage({ message }) {
      return signMessageUsingWebAuthn(message, chainId, [
        { id: webAuthnKey.authenticatorId, type: "public-key" }
      ])
    },
    async signTransaction(_, __) {
      throw new Error("SignTransactionNotSupportedBySmartAccount")
    },
    async signTypedData<
      const TTypedData extends TypedData | Record<string, unknown>,
      TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
    >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      const { domain, message, primaryType } =
        typedData as unknown as SignTypedDataParameters

      const types = {
        EIP712Domain: getTypesForEIP712Domain({ domain }),
        ...typedData.types
      }

      validateTypedData({ domain, message, primaryType, types })

      const hash = hashTypedData(typedData)
      const signature = await signMessage(client, {
        account,
        message: hash
      })
      return signature
    }
  })

  return {
    signer,
    address: validatorAddress,
    type: "validator",
    signUserOpHash: async (userOpHash: `0x${string}`) =>
      signer.signMessage({ message: userOpHash }),
    signMessage: async (_message: Uint8Array | string) => {
      const message =
        typeof _message === "string" ? _message : { raw: _message }
      const signature = await signer.signMessage({ message })
      return sanitizeSignature(signature)
    },
    client, // Add this line
    accountAddress: account.address, // Add this line
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
    ), // Add this line, adjust if needed
    deInitData: "0x", // Add this line, adjust if needed
    async getNonceKey(_accountAddress?: Address, customNonceKey?: bigint) {
      if (customNonceKey) {
        return customNonceKey
      }
      return 0n
    },
    async signUserOperation(userOperation: UserOperation) {
      const hash = getUserOperationHash({
        userOperation: {
          ...userOperation,
          signature: "0x"
        },
        chainId,
        entryPointAddress: entryPoint07Address,
        entryPointVersion: "0.7"
      })

      const signature: Hex = await signMessage(client, {
        account,
        message: { raw: hash }
      })
      return signature
    },
    async getStubSignature() {
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
    },
    getSerializedData() {
      return serializePasskeyValidatorData({
        entryPoint: entryPoint07Address,
        validatorAddress,
        pubKeyX: webAuthnKey.pubX,
        pubKeyY: webAuthnKey.pubY,
        authenticatorId: webAuthnKey.authenticatorId,
        authenticatorIdHash: webAuthnKey.authenticatorIdHash
      })
    }
  }
}

export async function deserializePasskeyValidator(
  client: Client,
  {
    serializedData
  }: {
    serializedData: string
  }
): Promise<ToPasskeyValidatorModuleReturnType> {
  const signer = await toSigner({ signer: client.account as Account })
  const {
    entryPoint,
    validatorAddress,
    pubKeyX,
    pubKeyY,
    authenticatorId,
    authenticatorIdHash
  } = deserializePasskeyValidatorData(serializedData)

  // Fetch chain id
  const chainId = await getChainId(client)

  // build account with passkey
  const account: LocalAccount = toAccount({
    // note that this address will be overwritten by actual address
    address: "0x0000000000000000000000000000000000000000",
    async signMessage({ message }) {
      return signMessageUsingWebAuthn(message, chainId, [
        { id: authenticatorId, type: "public-key" }
      ])
    },
    async signTransaction(_, __) {
      throw new Error("SignTransactionNotSupportedBySmartAccount")
    },
    async signTypedData<
      const TTypedData extends TypedData | Record<string, unknown>,
      TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
    >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      const { domain, message, primaryType } =
        typedData as unknown as SignTypedDataParameters

      const types = {
        EIP712Domain: getTypesForEIP712Domain({ domain }),
        ...typedData.types
      }

      validateTypedData({ domain, message, primaryType, types })

      const hash = hashTypedData(typedData)
      const signature = await signMessage(client, {
        account,
        message: hash
      })
      return signature
    }
  })

  return {
    signer,
    address: validatorAddress,
    type: "validator",
    signMessage: async (_message: Uint8Array | string) => {
      const message =
        typeof _message === "string" ? _message : { raw: _message }
      const signature = await signer.signMessage({ message })
      return sanitizeSignature(signature)
    },
    signUserOpHash: async (userOpHash: `0x${string}`) =>
      signer.signMessage({ message: userOpHash }),
    client, // Add this line
    accountAddress: account.address, // Add this line
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
          x: pubKeyX,
          y: pubKeyY
        },
        authenticatorIdHash
      ]
    ), // Add this line, adjust if needed
    deInitData: "0x", // Add this line, adjust if needed
    async getNonceKey() {
      return 0n
    },
    async signUserOperation(userOperation: UserOperation) {
      const hash = getUserOperationHash({
        userOperation: {
          ...userOperation,
          signature: "0x"
        },
        chainId,
        entryPointAddress: entryPoint07Address,
        entryPointVersion: "0.7"
      })

      const signature = await signMessage(client, {
        account,
        message: { raw: hash }
      })
      return signature
    },
    async getStubSignature(): Promise<Hex> {
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
    },
    getSerializedData() {
      return serializePasskeyValidatorData({
        entryPoint,
        validatorAddress,
        pubKeyX,
        pubKeyY,
        authenticatorId,
        authenticatorIdHash
      })
    }
  }
}
