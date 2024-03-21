import {
  type Abi,
  type Account,
  type Address,
  type Chain,
  type Client,
  type CustomSource,
  type EncodeDeployDataParameters,
  type Hash,
  type Hex,
  type SignableMessage,
  type Transport,
  type TypedData,
  type TypedDataDefinition,
  type WalletClient,
  concat,
  encodeAbiParameters,
  getAddress,
  keccak256,
  parseAbiParameters
} from "viem"
import * as chains from "viem/chains"

import { toAccount } from "viem/accounts"
import type { BaseValidationModule } from "../../modules/index.js"

import { signTypedData } from "viem/actions"
import { isSmartAccountDeployed } from "../biconomyV2/signerToSmartAccount.js"
import { ENTRYPOINT_ADDRESS_V06 } from "./constants.js"
import type {
  ENTRYPOINT_ADDRESS_V06_TYPE,
  GetUserOperationHashParams,
  SmartAccount,
  SmartAccountSigner,
  UserOperationStruct
} from "./types.js"

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
  getDummySignature(userOperation: UserOperationStruct): Promise<Hex>
  encodeDeployCallData: ({
    abi,
    args,
    bytecode
  }: EncodeDeployDataParameters<TAbi>) => Promise<Hex>
  signUserOperation: (userOperation: UserOperationStruct) => Promise<Hex>
  setActiveValidationModule: (
    validationModule: BaseValidationModule
  ) => BaseValidationModule
}): SmartAccount<TSource, transport, chain, TAbi> & {
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
      throw new Error("Sign transaction not supported by smart account")
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
  } as SmartAccount<TSource, transport, chain, TAbi> & {
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

type UserOperationKey = keyof UserOperationStruct

export const validateUserOp = (userOp: UserOperationStruct): boolean => {
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

// biome-ignore lint/suspicious/noExplicitAny: Can be use on dynamic types
export const isNullOrUndefined = (value: any): value is undefined => {
  return value === null || value === undefined
}

export function packUserOp(
  op: Partial<UserOperationStruct>,
  forSignature = true
): string {
  if (!op.initCode || !op.callData || !op.paymasterAndData)
    throw new Error("Missing userOp properties")
  if (forSignature) {
    return encodeAbiParameters(
      parseAbiParameters(
        "address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32"
      ),
      [
        op.sender as Hex,
        BigInt(op.nonce as Hex),
        keccak256(op.initCode as Hex),
        keccak256(op.callData as Hex),
        BigInt(op.callGasLimit as Hex),
        BigInt(op.verificationGasLimit as Hex),
        BigInt(op.preVerificationGas as Hex),
        BigInt(op.maxFeePerGas as Hex),
        BigInt(op.maxPriorityFeePerGas as Hex),
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
      BigInt(op.nonce as Hex),
      op.initCode as Hex,
      op.callData as Hex,
      BigInt(op.callGasLimit as Hex),
      BigInt(op.verificationGasLimit as Hex),
      BigInt(op.preVerificationGas as Hex),
      BigInt(op.maxFeePerGas as Hex),
      BigInt(op.maxPriorityFeePerGas as Hex),
      op.paymasterAndData as Hex,
      op.signature as Hex
    ]
  )
}

export const getUserOperationHash = ({
  userOperation,
  chainId
}: GetUserOperationHashParams): Hash => {
  const encoded = encodeAbiParameters(
    [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
    [
      keccak256(packUserOp(userOperation) as Hex),
      ENTRYPOINT_ADDRESS_V06,
      BigInt(chainId)
    ]
  ) as `0x${string}`

  return keccak256(encoded)
}

// biome-ignore lint/suspicious/noExplicitAny: it's a generic function, so it's hard to type
export function getAction<params extends any[], returnType extends {}>(
  client: Client,
  // biome-ignore lint/suspicious/noExplicitAny: it's a recursive function, so it's hard to type
  action: (_: any, ...params: params) => returnType,
  actionName: string = action.name
) {
  return (...params: params): returnType =>
    (
      client as Client & {
        [key: string]: (...params: params) => returnType
      }
    )[actionName]?.(...params) ?? action(client, ...params)
}

export function parseAccount(account: Address | Account): Account {
  if (typeof account === "string") return { address: account, type: "json-rpc" }
  return account
}

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
    }: { message: SignableMessage }): Promise<Hex> => {
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