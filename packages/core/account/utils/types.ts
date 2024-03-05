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

import {
  type ENTRYPOINT_ADDRESS_V07_TYPE,
  type SmartAccountSigner,
  type UserOperationStruct
} from "../../common/index.js"

import type { BaseValidationModule } from "../../modules/index.js"

export type BiconomySmartAccountConfig = {
  /** Factory address of biconomy factory contract or some other contract you have deployed on chain */
  factoryAddress?: Hex
  /** Sender address: If you want to override the Signer address with some other address and get counterfactual address can use this to pass the EOA and get SA address */
  senderAddress?: Hex
  /** implementation of smart contract address or some other contract you have deployed and want to override */
  implementationAddress?: Hex
  /** defaultFallbackHandler: override the default fallback contract address */
  defaultFallbackHandler?: Hex
  /** rpcUrl: Rpc url, optional, we set default rpc url if not passed. */
  rpcUrl?: string // as good as Provider
  /** paymasterUrl: The paymasterUrl retrieved from the Biconomy dashboard */
  paymasterUrl?: string
  /** activeValidationModule: The active validation module. Will default to the defaultValidationModule */
  activeValidationModule?: BaseValidationModule
  /** the index of SA the EOA have generated and till which indexes the upgraded SA should scan */
  maxIndexForScan?: number
  signer: SmartAccountSigner
  bundlerUrl: string
  accountIndex?: number
  entryPointAddress?: string
  defaultValidationModule: BaseValidationModule
}

export type SmartAccount<
  entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
  Name extends string = string,
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  TAbi extends Abi | readonly unknown[] = Abi
> = LocalAccount<Name> & {
  client: Client<transport, chain>
  entryPoint: entryPoint
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
}
