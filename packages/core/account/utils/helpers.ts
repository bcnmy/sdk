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
  encodeAbiParameters,
  keccak256,
  parseAbiParameters
} from "viem"
import * as chains from "viem/chains"

import {
  DEFAULT_ENTRYPOINT_ADDRESS,
  type ENTRYPOINT_ADDRESS_V07_TYPE,
  SignTransactionNotSupportedBySmartAccount,
  type UserOperationStruct,
  isSmartAccountDeployed
} from "../../common/index.js"

import type { BiconomySmartAccountConfig, SmartAccount } from "./types.js"

import { toAccount } from "viem/accounts"
import type { BaseValidationModule } from "../../modules/index.js"

const MAGIC_BYTES =
  "0x6492649264926492649264926492649264926492649264926492649264926492"

export const validateConfig = (config: BiconomySmartAccountConfig): void => {
  if (!config) {
    throw new Error("Config is missing")
  }
  // validate config and throw meaningful errors if something is missing
}

/**
 * Calculates the hash of a user operation.
 * @param userOp - The user operation struct.
 * @param chainId - The chain ID.
 * @param entryPointAddress - The entry point address (optional).
 * @returns The hash of the user operation.
 */
export const getUserOperationHash = (
  userOp: UserOperationStruct,
  chainId: number,
  entryPointAddress?: Address
): Hex => {
  const userOpHash = keccak256(packUserOp(userOp, true) as Hex)
  const enc = encodeAbiParameters(
    parseAbiParameters("bytes32, address, uint256"),
    [
      userOpHash,
      entryPointAddress ? entryPointAddress : DEFAULT_ENTRYPOINT_ADDRESS,
      BigInt(chainId)
    ]
  )
  return keccak256(enc)
}

/**
 * Packs the user operation into a string format.
 *
 * @param op - The user operation to pack.
 * @param forSignature - Optional parameter indicating whether the pack will include op.signature or not.
 * @returns The packed user operation as a string.
 * @throws Error if any of the required properties are missing in the user operation.
 */
export const packUserOp = (
  op: UserOperationStruct,
  forSignature = true
): string => {
  if (!op.initCode || !op.callData || !op.paymasterAndData)
    throw new Error("Missing userOp properties")
  if (forSignature) {
    return encodeAbiParameters(
      parseAbiParameters(
        "address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32"
      ),
      [
        op.sender as Hex,
        op.nonce,
        keccak256(op.initCode as Hex),
        keccak256(op.callData as Hex),
        op.callGasLimit,
        op.verificationGasLimit,
        op.preVerificationGas,
        op.maxFeePerGas,
        op.maxPriorityFeePerGas,
        keccak256(op.paymasterAndData as Hex)
      ]
    )
  }
  // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
  return encodeAbiParameters(
    parseAbiParameters(
      "address, uint256, bytes, bytes, uint256, uint256, uint256, uint256, uint256, bytes, bytes"
    ),
    [
      op.sender as Hex,
      op.nonce,
      op.initCode as Hex,
      op.callData as Hex,
      op.callGasLimit,
      op.verificationGasLimit,
      op.preVerificationGas,
      op.maxFeePerGas,
      op.maxPriorityFeePerGas,
      op.paymasterAndData as Hex,
      op.signature as Hex
    ]
  )
}

/**
 * Converts a custom source account into a smart account.
 *
 * @template TAccountSource - The type of the custom source account.
 * @template TEntryPoint - The type of the entry point address.
 * @template TSource - The type of the source.
 * @template transport - The transport type.
 * @template chain - The chain type.
 * @template TAbi - The ABI type.
 * @param {TAccountSource & {
 *   source: TSource;
 *   defaultValidationModule: BaseValidationModule;
 *   client: Client<transport, chain>;
 *   entryPoint: TEntryPoint;
 *   getNonce: () => Promise<bigint>;
 *   getInitCode: () => Promise<Hex>;
 *   getFactory: () => Promise<Address | undefined>;
 *   getFactoryData: () => Promise<Hex | undefined>;
 *   encodeCallData: (
 *     args:
 *       | {
 *           to: Address;
 *           value: bigint;
 *           data: Hex;
 *         }
 *       | {
 *           to: Address;
 *           value: bigint;
 *           data: Hex;
 *         }[]
 *   ) => Promise<Hex>;
 *   getDummySignature: (userOperation: UserOperationStruct) => Promise<Hex>;
 *   encodeDeployCallData: ({
 *     abi,
 *     args,
 *     bytecode
 *   }: EncodeDeployDataParameters<TAbi>) => Promise<Hex>;
 *   signUserOperation: (userOperation: UserOperationStruct) => Promise<Hex>;
 * }} options - The options for converting to a smart account.
 * @returns {SmartAccount<TEntryPoint, TSource, transport, chain, TAbi>} - The converted smart account.
 */
export function toSmartAccount<
  TAccountSource extends CustomSource,
  TEntryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
  TSource extends string = string,
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  TAbi extends Abi | readonly unknown[] = Abi
>({
  address,
  defaultValidationModule,
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
  signTypedData
}: TAccountSource & {
  source: TSource
  defaultValidationModule: BaseValidationModule
  client: Client<transport, chain>
  entryPoint: TEntryPoint
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
  getDummySignature(userOperation: UserOperationStruct): Promise<Hex>
  encodeDeployCallData: ({
    abi,
    args,
    bytecode
  }: EncodeDeployDataParameters<TAbi>) => Promise<Hex>
  signUserOperation: (userOperation: UserOperationStruct) => Promise<Hex>
}): SmartAccount<TEntryPoint, TSource, transport, chain, TAbi> {
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
    defaultValidationModule,
    type: "local",
    entryPoint,
    publicKey: address,
    getNonce,
    getInitCode,
    getFactory,
    getFactoryData,
    encodeCallData,
    getDummySignature,
    encodeDeployCallData,
    signUserOperation
  } as SmartAccount<TEntryPoint, TSource, transport, chain, TAbi>
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
