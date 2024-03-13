import {
  type Abi,
  type Address,
  type Chain,
  type Client,
  type CustomSource,
  type EncodeDeployDataParameters,
  type Hex,
  type SignableMessage,
  type Transport,
  type TypedDataDefinition,
  concat,
  encodeAbiParameters
} from "viem"
import * as chains from "viem/chains"

import { toAccount } from "viem/accounts"
import type { BaseValidationModule } from "../../modules/index.js"

import { type UserOperation, isSmartAccountDeployed } from "permissionless"
import { SignTransactionNotSupportedBySmartAccount } from "permissionless/accounts"
import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types/entrypoint.js"

import type { SmartAccount } from "./types.js"

const MAGIC_BYTES =
  "0x6492649264926492649264926492649264926492649264926492649264926492"

export function toSmartAccount<
  TAccountSource extends CustomSource,
  TEntryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE,
  TSource extends string = string,
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  TAbi extends Abi | readonly unknown[] = Abi
>({
  address,
  defaultValidationModule,
  activeValidationModule,
  client,
  source,
  entryPoint,
  getNonce,
  getInitCode,
  getFactory,
  getFactoryData,
  encodeCallData,
  getDummySignature,
  encodeDeployCallData,
  signUserOperation,
  signMessage,
  signTypedData,
  setActiveValidationModule
}: TAccountSource & {
  source: TSource
  client: Client<transport, chain>
  entryPoint: TEntryPoint
  defaultValidationModule: BaseValidationModule
  activeValidationModule: BaseValidationModule
  getNonce: () => Promise<bigint>
  getInitCode: () => Promise<Hex>
  getFactory: () => Promise<Address | undefined>
  getFactoryData: () => Promise<Hex | undefined>
  encodeCallData: (
    args:
      | {
          to: Address
          value: bigint
          data: Hex
        }
      | {
          to: Address
          value: bigint
          data: Hex
        }[]
  ) => Promise<Hex>
  getDummySignature(userOperation: UserOperation<"v0.6">): Promise<Hex>
  encodeDeployCallData: ({
    abi,
    args,
    bytecode
  }: EncodeDeployDataParameters<TAbi>) => Promise<Hex>
  signUserOperation: (userOperation: UserOperation<"v0.6">) => Promise<Hex>
  setActiveValidationModule: (
    validationModule: BaseValidationModule
  ) => BaseValidationModule
}): SmartAccount<TEntryPoint, TSource, transport, chain, TAbi> & {
  defaultValidationModule: BaseValidationModule
  activeValidationModule: BaseValidationModule
  setActiveValidationModule: (
    validationModule: BaseValidationModule
  ) => BaseValidationModule
} {
  const account = toAccount({
    address: address,
    signMessage: async ({ message }: { message: SignableMessage }) => {
      const isDeployed = await isSmartAccountDeployed(client, address)
      const signature = await signMessage({ message })

      if (isDeployed) return signature

      const abiEncodedMessage = encodeAbiParameters(
        [
          {
            type: "address",
            name: "create2Factory"
          },
          {
            type: "bytes",
            name: "factoryCalldata"
          },
          {
            type: "bytes",
            name: "originalERC1271Signature"
          }
        ],
        [
          (await getFactory()) ?? "0x", // "0x should never happen if it's deployed"
          (await getFactoryData()) ?? "0x", // "0x should never happen if it's deployed"
          signature
        ]
      )

      return concat([abiEncodedMessage, MAGIC_BYTES])
    },
    signTypedData: async (typedData) => {
      const isDeployed = await isSmartAccountDeployed(client, address)
      const signature = await signTypedData(typedData as TypedDataDefinition)

      if (isDeployed) return signature

      const abiEncodedMessage = encodeAbiParameters(
        [
          {
            type: "address",
            name: "create2Factory"
          },
          {
            type: "bytes",
            name: "factoryCalldata"
          },
          {
            type: "bytes",
            name: "originalERC1271Signature"
          }
        ],
        [
          (await getFactory()) ?? "0x", // "0x should never happen if it's deployed"
          (await getFactoryData()) ?? "0x", // "0x should never happen if it's deployed"
          signature
        ]
      )

      return concat([abiEncodedMessage, MAGIC_BYTES])
    },
    async signTransaction(_, __) {
      throw new SignTransactionNotSupportedBySmartAccount()
    }
  })

  return {
    ...account,
    source,
    client,
    type: "local",
    entryPoint,
    defaultValidationModule,
    activeValidationModule,
    publicKey: address,
    getNonce,
    getInitCode,
    getFactory,
    getFactoryData,
    encodeCallData,
    getDummySignature,
    encodeDeployCallData,
    signUserOperation,
    setActiveValidationModule
  } as SmartAccount<TEntryPoint, TSource, transport, chain, TAbi> & {
    defaultValidationModule: BaseValidationModule
    activeValidationModule: BaseValidationModule
    setActiveValidationModule: (
      validationModule: BaseValidationModule
    ) => BaseValidationModule
  }
}

/**
 * Utility method for converting a chainId to a {@link Chain} object
 *
 * @param chainId
 * @returns a {@link Chain} object for the given chainId
 * @throws if the chainId is not found
 */
export const getChain = (chainId: number): Chain => {
  for (const chain of Object.values(chains)) {
    // @ts-ignore
    if (chain.id === chainId) {
      return chain as Chain
    }
  }
  throw new Error("could not find chain")
}

type UserOperationKey = keyof UserOperation<"v0.6">

export const validateUserOp = (userOp: UserOperation<"v0.6">): boolean => {
  const requiredFields: UserOperationKey[] = [
    "sender",
    "nonce",
    "initCode",
    "callData",
    "callGasLimit",
    "verificationGasLimit",
    "preVerificationGas",
    "maxFeePerGas",
    "maxPriorityFeePerGas",
    "paymasterAndData"
  ]
  for (const field of requiredFields) {
    if (isNullOrUndefined(userOp[field])) {
      throw new Error(`${String(field)} is missing in the UserOp`)
    }
  }
  return true
}

export const isNullOrUndefined = (value: any): value is undefined => {
  return value === null || value === undefined
}
