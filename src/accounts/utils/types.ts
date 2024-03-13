import type {
  Abi,
  Address,
  Chain,
  Client,
  EncodeDeployDataParameters,
  Hex,
  LocalAccount,
  Transport
} from "viem"

import type { BaseValidationModule } from "../../modules/index.js"

export type UserOperationStruct = {
  sender: Address
  nonce: bigint
  factory?: Address
  factoryData?: Hex
  callData: Hex
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymaster?: Address
  paymasterVerificationGasLimit?: bigint
  paymasterPostOpGasLimit?: bigint
  paymasterData?: Hex
  signature: Hex
  initCode?: Hex
  paymasterAndData?: Hex
}

export type SmartAccountSigner<
  TSource extends string = "custom",
  TAddress extends Address = Address
> = Omit<LocalAccount<TSource, TAddress>, "signTransaction">

export type TChain = Chain | undefined

export type EntryPointVersion = "v0.6" | "v0.7"
export type ENTRYPOINT_ADDRESS_V07_TYPE =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032"

export type Transaction = {
  to: Address
  value?: bigint | 0n
  data?: Hex | "0x"
}

/**
 * Represents a smart account.
 *
 * @template entryPoint - The type of the entry point address.
 * @template Name - The type of the account name.
 * @template transport - The type of the transport.
 * @template chain - The type of the chain.
 * @template TAbi - The type of the ABI.
 */
export type SmartAccount<
  entryPoint = ENTRYPOINT_ADDRESS_V07_TYPE,
  Name extends string = string,
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  TAbi extends Abi | readonly unknown[] = Abi
> = LocalAccount<Name> & {
  /**
   * The client associated with the smart account.
   */
  client: Client<transport, chain>

  /**
   * The entry point address of the smart account.
   */
  entryPoint: entryPoint

  /**
   * The default validation module of the smart account.
   */
  defaultValidationModule: BaseValidationModule

  /**
   * Retrieves the nonce of the smart account.
   *
   * @returns A promise that resolves to the nonce as a bigint.
   */
  getNonce: () => Promise<bigint>

  /**
   * Retrieves the initialization code of the smart account.
   *
   * @returns A promise that resolves to the initialization code as a Hex string.
   */
  getInitCode: () => Promise<Hex>

  /**
   * Retrieves the factory address of the smart account.
   *
   * @returns A promise that resolves to the factory address as an Address, or undefined if not available.
   */
  getFactory: () => Promise<Address | undefined>

  /**
   * Retrieves the factory data of the smart account.
   *
   * @returns A promise that resolves to the factory data as a Hex string, or undefined if not available.
   */
  getFactoryData: () => Promise<Hex | undefined>

  /**
   * Encodes the call data for a transaction.
   *
   * @param args - The Transaction arguments.
   * @returns A promise that resolves to the encoded call data as a Hex string.
   */
  encodeCallData: (args: Transaction | Transaction[]) => Promise<Hex>

  /**
   * Retrieves the dummy signature for a user operation.
   *
   * @param userOperation - The user operation.
   * @returns A promise that resolves to the dummy signature as a Hex string.
   */
  getDummySignature(userOperation: UserOperationStruct): Promise<Hex>

  /**
   * Encodes the deploy call data for a smart contract.
   *
   * @param parameters - The parameters for encoding the deploy call data.
   * @returns A promise that resolves to the encoded deploy call data as a Hex string.
   */
  encodeDeployCallData: ({
    abi,
    args,
    bytecode
  }: EncodeDeployDataParameters<TAbi>) => Promise<Hex>

  /**
   * Signs a user operation.
   *
   * @param userOperation - The user operation to sign.
   * @returns A promise that resolves to the signed user operation as a Hex string.
   */
  signUserOperation: (userOperation: UserOperationStruct) => Promise<Hex>
}
