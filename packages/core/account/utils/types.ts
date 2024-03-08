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

import type {
  ENTRYPOINT_ADDRESS_V07_TYPE,
  SmartAccountSigner,
  Transaction,
  UserOperationStruct
} from "../../common/index.js"

import type { BaseValidationModule } from "../../modules/index.js"

/**
 * Configuration options for Biconomy Smart Account.
 */
export type BiconomySmartAccountConfig = {
  /** Factory address of Biconomy factory contract or some other contract you have deployed on chain */
  factoryAddress?: Hex
  /** Sender address: If you want to override the Signer address with some other address and get counterfactual address can use this to pass the EOA and get SA address */
  senderAddress?: Hex
  /** Implementation of smart contract address or some other contract you have deployed and want to override */
  implementationAddress?: Hex
  /** Default fallback handler: override the default fallback contract address */
  defaultFallbackHandler?: Hex
  /** Rpc url, optional, we set default rpc url if not passed */
  rpcUrl?: string
  /** The paymasterUrl retrieved from the Biconomy dashboard */
  paymasterUrl?: string
  /** The active validation module. Will default to the defaultValidationModule */
  activeValidationModule?: BaseValidationModule
  /** The index of SA the EOA have generated and till which indexes the upgraded SA should scan */
  maxIndexForScan?: number
  /** The signer for the Smart Account */
  signer: SmartAccountSigner
  /** The bundler URL you get from the dashboard */
  bundlerUrl: string
  /** The account index, each index represents a different smart account from the same EOA address */
  accountIndex?: number
  /** The entry point address */
  entryPointAddress?: string
  /** The default validation module, if not provided this is ECDSA Validation Module */
  defaultValidationModule?: BaseValidationModule
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
  entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
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

/**
 * Represents the parameters for getting an account address.
 */
export type GetAccountAddressParams = {
  /**
   * The address of the factory.
   */
  factoryAddress: Address
  /**
   * The address of the account logic.
   */
  accountLogicAddress: Address
  /**
   * The address of the fallback handler.
   */
  fallbackHandlerAddress: Address
  /**
   * The validation module for the account.
   */
  validationModule: BaseValidationModule
  /**
   * The index of the account (optional).
   */
  index?: bigint
}
