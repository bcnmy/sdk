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
import { SignTransactionNotSupportedBySmartAccount } from "./errors.js"
import type {
  BiconomySmartAccountConfig,
  ENTRYPOINT_ADDRESS_V07_TYPE,
  SmartAccount,
  UserOperationStruct
} from "./types.js"

import { toAccount } from "viem/accounts"
import type { BaseValidationModule } from "../../modules/index.js"

import type { Account, TypedData, WalletClient } from "viem"

import { getBytecode, readContract, signTypedData } from "viem/actions"
import { DEFAULT_ENTRYPOINT_ADDRESS } from "./constants.js"
import type { SmartAccountSigner } from "./types.js"

/**
 * Converts a wallet client to a smart account signer.
 * @template TChain - The type of chain.
 * @param {WalletClient<Transport, TChain, Account>} walletClient - The wallet client to convert.
 * @returns {SmartAccountSigner<"custom", Address>} - The converted smart account signer.
 */
export function walletClientToSmartAccountSigner<
  TChain extends Chain | undefined = Chain | undefined
>(
  walletClient: WalletClient<Transport, TChain, Account>
): SmartAccountSigner<"custom", Address> {
  return {
    address: walletClient.account.address,
    type: "local",
    source: "custom",
    publicKey: walletClient.account.address,
    signMessage: async ({
      message
    }: {
      message: SignableMessage
    }): Promise<Hex> => {
      return walletClient.signMessage({ message })
    },
    async signTypedData<
      const TTypedData extends TypedData | Record<string, unknown>,
      TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
    >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      return signTypedData<TTypedData, TPrimaryType, TChain, Account>(
        walletClient,
        {
          account: walletClient.account,
          ...typedData
        }
      )
    }
  }
}

/**
 * Checks if a smart account is deployed at the given address.
 * @param client - The client object used to interact with the blockchain.
 * @param address - The address of the smart account.
 * @returns A promise that resolves to a boolean indicating whether the smart account is deployed or not.
 */
export const isSmartAccountDeployed = async (
  client: Client,
  address: Address
): Promise<boolean> => {
  const contractCode = await getBytecode(client, {
    address: address
  })

  if ((contractCode?.length ?? 0) > 2) {
    return true
  }
  return false
}

/**
 * Retrieves the nonce for a given sender address.
 * If a nonce key is provided, it will be used to specify the nonce space.
 * If no nonce key is provided, the default nonce space (0) will be used.
 *
 * @param client - The client object used to interact with the blockchain.
 * @param sender - The sender address for which to retrieve the nonce.
 * @param nonceKey - Optional nonce key to specify the nonce space.
 * @returns The nonce value as a bigint.
 */
export const getNonce = async (
  client: Client,
  sender: Address,
  nonceKey?: number
): Promise<bigint> => {
  const nonceSpace = nonceKey ?? 0
  try {
    return readContract(client, {
      address: DEFAULT_ENTRYPOINT_ADDRESS,
      abi: [
        {
          inputs: [
            {
              name: "sender",
              type: "address"
            },
            {
              name: "key",
              type: "uint192"
            }
          ],
          name: "getNonce",
          outputs: [
            {
              name: "nonce",
              type: "uint256"
            }
          ],
          stateMutability: "view",
          type: "function"
        }
      ],
      functionName: "getNonce",
      args: [sender, BigInt(nonceSpace)]
    })
  } catch (e) {
    return BigInt(0)
  }
}

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
