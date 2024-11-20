// viem
import {
  type AbiParameter,
  type Account,
  type Address,
  type Chain,
  type ClientConfig,
  type Hex,
  type Prettify,
  type PublicClient,
  type RpcSchema,
  type SignableMessage,
  type Transport,
  type TypedData,
  type TypedDataDefinition,
  type UnionPartialBy,
  type WalletClient,
  concat,
  concatHex,
  createPublicClient,
  createWalletClient,
  domainSeparator,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContract,
  keccak256,
  parseAbi,
  parseAbiParameters,
  publicActions,
  toBytes,
  toHex,
  validateTypedData,
  zeroAddress
} from "viem"
import {
  type SmartAccount,
  type SmartAccountImplementation,
  type UserOperation,
  entryPoint07Address,
  getUserOperationHash,
  toSmartAccount
} from "viem/account-abstraction"

import {
  ENTRY_POINT_ADDRESS,
  k1ValidatorAddress as k1ValidatorAddress_,
  k1ValidatorFactoryAddress
} from "../constants"
// Constants
import { EntrypointAbi } from "../constants/abi"

// Modules
import { toK1Validator } from "../modules/k1Validator/toK1Validator"
import type { Module } from "../modules/utils/Types"

import {
  EXECUTE_BATCH,
  EXECUTE_SINGLE,
  MAGIC_BYTES,
  PARENT_TYPEHASH
} from "./utils/Constants"
// Utils
import type { Call } from "./utils/Types"
import {
  type TypedDataWith712,
  addressEquals,
  eip712WrapHash,
  getAccountDomainStructFields,
  getTypesForEIP712Domain,
  isNullOrUndefined,
  typeToString
} from "./utils/Utils"
import { type Signer, type UnknownSigner, toSigner } from "./utils/toSigner"

/**
 * Parameters for creating a Nexus Smart Account
 */
export type ToNexusSmartAccountParameters = {
  /** The blockchain network */
  chain: Chain
  /** The transport configuration */
  transport: ClientConfig["transport"]
  /** The signer account or address */
  signer: UnknownSigner
  /** Optional index for the account */
  index?: bigint | undefined
  /** Optional active validation module */
  module?: Module
  /** Optional factory address */
  factoryAddress?: Address
  /** Optional K1 validator address */
  k1ValidatorAddress?: Address
  /** Optional account address override */
  accountAddress?: Address
} & Prettify<
  Pick<
    ClientConfig<Transport, Chain, Account, RpcSchema>,
    | "account"
    | "cacheTime"
    | "chain"
    | "key"
    | "name"
    | "pollingInterval"
    | "rpcSchema"
  >
>

/**
 * Nexus Smart Account type
 */
export type NexusAccount = Prettify<
  SmartAccount<NexusSmartAccountImplementation>
>

/**
 * Nexus Smart Account Implementation
 */
export type NexusSmartAccountImplementation = SmartAccountImplementation<
  typeof EntrypointAbi,
  "0.7",
  {
    getCounterFactualAddress: () => Promise<Address>
    isDeployed: () => Promise<boolean>
    getInitCode: () => Hex
    encodeExecute: (call: Call) => Promise<Hex>
    encodeExecuteBatch: (calls: readonly Call[]) => Promise<Hex>
    getUserOpHash: (userOp: UserOperation) => Hex
    setModule: (validationModule: Module) => void
    getModule: () => Module
    factoryData: Hex
    factoryAddress: Address
    signer: Signer
    publicClient: PublicClient
    walletClient: WalletClient
  }
>

/**
 * @description Create a Nexus Smart Account.
 *
 * @param parameters - {@link ToNexusSmartAccountParameters}
 * @returns Nexus Smart Account. {@link NexusAccount}
 *
 * @example
 * import { toNexusAccount } from '@biconomy/sdk'
 * import { createWalletClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const account = await toNexusAccount({
 *   chain: mainnet,
 *   transport: http(),
 *   signer: '0x...',
 * })
 */
export const toNexusAccount = async (
  parameters: ToNexusSmartAccountParameters
): Promise<NexusAccount> => {
  const {
    chain,
    transport,
    signer: _signer,
    index = 0n,
    module: module_,
    factoryAddress = k1ValidatorFactoryAddress,
    k1ValidatorAddress = k1ValidatorAddress_,
    key = "nexus account",
    name = "Nexus Account"
  } = parameters

  // @ts-ignore
  const signer = await toSigner({ signer: _signer })

  const walletClient = createWalletClient({
    account: signer,
    chain,
    transport,
    key,
    name
  }).extend(publicActions)

  const publicClient = createPublicClient({
    chain,
    transport
  })

  const signerAddress = walletClient.account.address

  const entryPointContract = getContract({
    address: ENTRY_POINT_ADDRESS,
    abi: EntrypointAbi,
    client: {
      public: publicClient,
      wallet: walletClient
    }
  })

  // Review:
  // Todo: attesters can be added here to do one time setup upon deployment.
  const factoryData = encodeFunctionData({
    abi: parseAbi([
      "function createAccount(address eoaOwner, uint256 index, address[] attesters, uint8 threshold) external returns (address)"
    ]),
    functionName: "createAccount",
    args: [signerAddress, index, [], 0]
  })

  let _accountAddress: Address | undefined = parameters.accountAddress

  /**
   * @description Gets the init code for the account
   * @returns The init code as a hexadecimal string
   */
  const getInitCode = () => concatHex([factoryAddress, factoryData])

  /**
   * @description Gets the counterfactual address of the account
   * @returns The counterfactual address
   * @throws {Error} If unable to get the counterfactual address
   */
  const getCounterFactualAddress = async (): Promise<Address> => {
    if (!isNullOrUndefined(_accountAddress)) return _accountAddress
    try {
      await entryPointContract.simulate.getSenderAddress([getInitCode()])
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (e: any) {
      if (e?.cause?.data?.errorName === "SenderAddressResult") {
        _accountAddress = e?.cause.data.args[0] as Address
        if (!addressEquals(_accountAddress, zeroAddress)) {
          return _accountAddress
        }
      }
    }
    throw new Error("Failed to get counterfactual account address")
  }

  let module =
    module_ ??
    toK1Validator({
      address: k1ValidatorAddress,
      accountAddress: await getCounterFactualAddress(),
      initData: signerAddress,
      deInitData: "0x",
      signer
    })

  /**
   * @description Checks if the account is deployed
   * @returns True if the account is deployed, false otherwise
   */
  const isDeployed = async (): Promise<boolean> => {
    const address = await getCounterFactualAddress()
    const contractCode = await publicClient.getCode({ address })
    return (contractCode?.length ?? 0) > 2
  }

  /**
   * @description Calculates the hash of a user operation
   * @param userOp - The user operation
   * @returns The hash of the user operation
   */
  const getUserOpHash = (userOp: UserOperation): Hex => {
    return getUserOperationHash({
      chainId: chain.id,
      entryPointAddress: entryPoint07Address,
      entryPointVersion: "0.7",
      userOperation: userOp
    })
  }

  /**
   * @description Encodes a batch of calls for execution
   * @param calls - An array of calls to encode
   * @param mode - The execution mode
   * @returns The encoded calls
   */
  const encodeExecuteBatch = async (
    calls: readonly Call[],
    mode = EXECUTE_BATCH
  ): Promise<Hex> => {
    const executionAbiParams: AbiParameter = {
      type: "tuple[]",
      components: [
        { name: "target", type: "address" },
        { name: "value", type: "uint256" },
        { name: "callData", type: "bytes" }
      ]
    }

    const executions = calls.map((tx) => ({
      target: tx.to,
      callData: tx.data ?? "0x",
      value: BigInt(tx.value ?? 0n)
    }))

    const executionCalldataPrep = encodeAbiParameters(
      [executionAbiParams],
      [executions]
    )
    return encodeFunctionData({
      abi: parseAbi([
        "function execute(bytes32 mode, bytes calldata executionCalldata) external"
      ]),
      functionName: "execute",
      args: [mode, executionCalldataPrep]
    })
  }

  /**
   * @description Encodes a single call for execution
   * @param call - The call to encode
   * @param mode - The execution mode
   * @returns The encoded call
   */
  const encodeExecute = async (
    call: Call,
    mode = EXECUTE_SINGLE
  ): Promise<Hex> => {
    const executionCalldata = encodePacked(
      ["address", "uint256", "bytes"],
      [call.to as Hex, BigInt(call.value ?? 0n), (call.data ?? "0x") as Hex]
    )

    return encodeFunctionData({
      abi: parseAbi([
        "function execute(bytes32 mode, bytes calldata executionCalldata) external"
      ]),
      functionName: "execute",
      args: [mode, executionCalldata]
    })
  }

  /**
   * @description Gets the nonce for the account
   * @param args - Optional arguments for getting the nonce
   * @returns The nonce
   */
  const getNonce = async (parameters?: {
    key?: bigint
    validationMode?: "0x00" | "0x01"
  }): Promise<bigint> => {
    try {
      const TIMESTAMP_ADJUSTMENT = 16777215n
      const defaultedKey = BigInt(parameters?.key ?? 0n) % TIMESTAMP_ADJUSTMENT
      const defaultedValidationMode = parameters?.validationMode ?? "0x00"
      const key: string = concat([
        toHex(defaultedKey, { size: 3 }),
        defaultedValidationMode,
        module.address as Hex
      ])

      const accountAddress = await getCounterFactualAddress()
      return await entryPointContract.read.getNonce([
        accountAddress,
        BigInt(key)
      ])
    } catch (e) {
      return 0n
    }
  }
  /**
   * @description Changes the active module for the account
   * @param module - The new module to set as active
   * @returns void
   */
  const setModule = (validationModule: Module): void => {
    module = validationModule
  }

  /**
   * @description Signs a message
   * @param params - The parameters for signing
   * @param params.message - The message to sign
   * @returns The signature
   */
  const signMessage = async ({
    message
  }: { message: SignableMessage }): Promise<Hex> => {
    const tempSignature = await module.signMessage(message)

    const signature = encodePacked(
      ["address", "bytes"],
      [module.address as Hex, tempSignature]
    )

    const erc6492Signature = concat([
      encodeAbiParameters(
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
        [factoryAddress, factoryData, signature]
      ),
      MAGIC_BYTES
    ])

    const accountIsDeployed = await isDeployed()
    return accountIsDeployed ? signature : erc6492Signature
  }

  /**
   * @description Signs typed data
   * @param parameters - The typed data parameters
   * @returns The signature
   */
  async function signTypedData<
    const typedData extends TypedData | Record<string, unknown>,
    primaryType extends keyof typedData | "EIP712Domain" = keyof typedData
  >(parameters: TypedDataDefinition<typedData, primaryType>): Promise<Hex> {
    const { message, primaryType, types: _types, domain } = parameters

    if (!domain) throw new Error("Missing domain")
    if (!message) throw new Error("Missing message")

    const types = {
      EIP712Domain: getTypesForEIP712Domain({ domain }),
      ..._types
    }

    // @ts-ignore: Comes from nexus parent typehash
    const messageStuff: Hex = message.stuff

    // @ts-ignore
    validateTypedData({
      domain,
      message,
      primaryType,
      types
    })

    const appDomainSeparator = domainSeparator({ domain })
    const accountDomainStructFields = await getAccountDomainStructFields(
      publicClient,
      await getCounterFactualAddress()
    )

    const parentStructHash = keccak256(
      encodePacked(
        ["bytes", "bytes"],
        [
          encodeAbiParameters(parseAbiParameters(["bytes32, bytes32"]), [
            keccak256(toBytes(PARENT_TYPEHASH)),
            messageStuff
          ]),
          accountDomainStructFields
        ]
      )
    )

    const wrappedTypedHash = eip712WrapHash(
      parentStructHash,
      appDomainSeparator
    )

    let signature = await module.signMessage({ raw: toBytes(wrappedTypedHash) })

    const contentsType = toBytes(typeToString(types as TypedDataWith712)[1])

    const signatureData = concatHex([
      signature,
      appDomainSeparator,
      messageStuff,
      toHex(contentsType),
      toHex(contentsType.length, { size: 2 })
    ])

    signature = encodePacked(
      ["address", "bytes"],
      [module.address as Hex, signatureData]
    )

    return signature
  }

  return toSmartAccount({
    client: walletClient,
    entryPoint: {
      abi: EntrypointAbi,
      address: ENTRY_POINT_ADDRESS,
      version: "0.7"
    },
    getAddress: getCounterFactualAddress,
    encodeCalls: (calls: readonly Call[]): Promise<Hex> => {
      return calls.length === 1
        ? encodeExecute(calls[0])
        : encodeExecuteBatch(calls)
    },
    getFactoryArgs: async () => ({ factory: factoryAddress, factoryData }),
    getStubSignature: async (): Promise<Hex> => module.getStubSignature(),
    signMessage,
    signTypedData,
    signUserOperation: async (
      parameters: UnionPartialBy<UserOperation, "sender"> & {
        chainId?: number | undefined
      }
    ): Promise<Hex> => {
      const { chainId = publicClient.chain.id, ...userOpWithoutSender } =
        parameters
      const address = await getCounterFactualAddress()

      const userOperation = {
        ...userOpWithoutSender,
        sender: address
      }

      const hash = getUserOperationHash({
        chainId,
        entryPointAddress: entryPoint07Address,
        entryPointVersion: "0.7",
        userOperation
      })
      return await module.signUserOpHash(hash)
    },
    getNonce,
    extend: {
      entryPointAddress: entryPoint07Address,
      getCounterFactualAddress,
      isDeployed,
      getInitCode,
      encodeExecute,
      encodeExecuteBatch,
      getUserOpHash,
      setModule,
      getModule: () => module,
      factoryData,
      factoryAddress,
      signer,
      walletClient,
      publicClient
    }
  })
}
