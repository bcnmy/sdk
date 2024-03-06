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

import {
  DEFAULT_ENTRYPOINT_ADDRESS,
  type ENTRYPOINT_ADDRESS_V07_TYPE,
  SignTransactionNotSupportedBySmartAccount,
  type UserOperationStruct,
  isSmartAccountDeployed
} from "../../common/index.js"

import { type BiconomySmartAccountConfig, type SmartAccount } from "./types.js"

import { toAccount } from "viem/accounts"

const MAGIC_BYTES =
  "0x6492649264926492649264926492649264926492649264926492649264926492"

export const validateConfig = (config: BiconomySmartAccountConfig): void => {
  if (!config) {
    throw new Error("Config is missing")
  }
  // validate config and throw meaningful errors if something is missing
}

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

export function toSmartAccount<
  TAccountSource extends CustomSource,
  TEntryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
  TSource extends string = string,
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  TAbi extends Abi | readonly unknown[] = Abi
>({
  address,
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
