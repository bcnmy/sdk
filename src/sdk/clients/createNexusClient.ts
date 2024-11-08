import type {
  Address,
  BundlerRpcSchema,
  Chain,
  Client,
  ClientConfig,
  EstimateFeesPerGasReturnType,
  Prettify,
  RpcSchema,
  Transport
} from "viem"
import type {
  BundlerActions,
  BundlerClientConfig,
  PaymasterActions,
  SmartAccount,
  UserOperationRequest
} from "viem/account-abstraction"

import { type NexusAccount, toNexusAccount } from "../account/toNexusAccount"
import type { UnknownSigner } from "../account/utils/toSigner"
import {
  k1ValidatorAddress as k1ValidatorAddress_,
  k1ValidatorFactoryAddress
} from "../constants"
import type { AnyData, Module } from "../modules/utils/Types"
import { createBicoBundlerClient } from "./createBicoBundlerClient"
import { type Erc7579Actions, erc7579Actions } from "./decorators/erc7579"
import {
  type SmartAccountActions,
  smartAccountActions
} from "./decorators/smartAccount"

/**
 * Nexus Client type
 */
export type NexusClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends NexusAccount | undefined = NexusAccount | undefined,
  client extends Client | undefined = Client | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Client<
    transport,
    chain extends Chain
      ? chain
      : client extends Client<AnyData, infer chain>
        ? chain
        : undefined,
    account,
    rpcSchema extends RpcSchema
      ? [...BundlerRpcSchema, ...rpcSchema]
      : BundlerRpcSchema,
    BundlerActions<account>
  >
> &
  BundlerActions<NexusAccount> &
  Erc7579Actions<NexusAccount> &
  SmartAccountActions<chain, NexusAccount> & {
    /**
     * The Nexus account associated with this client
     */
    account: NexusAccount
    /**
     * Optional client for additional functionality
     */
    client?: client | Client | undefined
    /**
     * Transport configuration for the bundler
     */
    bundlerTransport?: BundlerClientConfig["transport"]
    /**
     * Optional paymaster configuration
     */
    paymaster?: BundlerClientConfig["paymaster"] | undefined
    /**
     * Optional paymaster context
     */
    paymasterContext?: BundlerClientConfig["paymasterContext"] | undefined
    /**
     * Optional user operation configuration
     */
    userOperation?: BundlerClientConfig["userOperation"] | undefined
  }

/**
 * Configuration for creating a Nexus Client
 */
export type NexusClientConfig<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  client extends Client | undefined = Client | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Pick<
    ClientConfig<transport, chain, SmartAccount, rpcSchema>,
    "cacheTime" | "chain" | "key" | "name" | "pollingInterval" | "rpcSchema"
  > & {
    /** RPC URL. */
    transport: transport
    /** Bundler URL. */
    bundlerTransport: transport
    /** Client that points to an Execution RPC URL. */
    client?: client | Client | undefined
    /** Paymaster configuration. */
    paymaster?:
      | true
      | {
          /** Retrieves paymaster-related User Operation properties to be used for sending the User Operation. */
          getPaymasterData?: PaymasterActions["getPaymasterData"] | undefined
          /** Retrieves paymaster-related User Operation properties to be used for gas estimation. */
          getPaymasterStubData?:
            | PaymasterActions["getPaymasterStubData"]
            | undefined
        }
      | undefined
    /** Paymaster context to pass to `getPaymasterData` and `getPaymasterStubData` calls. */
    paymasterContext?: unknown
    /** User Operation configuration. */
    userOperation?:
      | {
          /** Prepares fee properties for the User Operation request. */
          estimateFeesPerGas?:
            | ((parameters: {
                account: SmartAccount | undefined
                bundlerClient: Client
                userOperation: UserOperationRequest
              }) => Promise<EstimateFeesPerGasReturnType<"eip1559">>)
            | undefined
        }
      | undefined
    /** Owner of the account. */
    signer: UnknownSigner
    /** Index of the account. */
    index?: bigint
    /** Active module of the account. */
    module?: Module
    /** Factory address of the account. */
    factoryAddress?: Address
    /** Owner module */
    k1ValidatorAddress?: Address
    /** Account address */
    accountAddress?: Address
  }
>

/**
 * Creates a Nexus Client for interacting with the Nexus smart account system.
 *
 * @param parameters - {@link NexusClientConfig}
 * @returns Nexus Client. {@link NexusClient}
 *
 * @example
 * import { createNexusClient } from '@biconomy/sdk'
 * import { http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const nexusClient = await createNexusClient({
 *   chain: mainnet,
 *   transport: http('https://mainnet.infura.io/v3/YOUR-PROJECT-ID'),
 *   bundlerTransport: http('https://api.biconomy.io'),
 *   signer: '0x...',
 * })
 */
export async function createNexusClient(
  parameters: NexusClientConfig
): Promise<NexusClient> {
  const {
    client: client_,
    chain = parameters.chain ?? client_?.chain,
    signer,
    index = 0n,
    key = "nexus client",
    name = "Nexus Client",
    module,
    factoryAddress = k1ValidatorFactoryAddress,
    k1ValidatorAddress = k1ValidatorAddress_,
    bundlerTransport,
    transport,
    accountAddress,
    ...bundlerConfig
  } = parameters

  if (!chain) throw new Error("Missing chain")

  const nexusAccount = await toNexusAccount({
    accountAddress,
    transport,
    chain,
    signer,
    index,
    module,
    factoryAddress,
    k1ValidatorAddress
  })

  const bundler_ = createBicoBundlerClient({
    ...bundlerConfig,
    chain,
    key,
    name,
    account: nexusAccount,
    transport: bundlerTransport
  })
    .extend(erc7579Actions())
    .extend(smartAccountActions())

  return bundler_ as unknown as NexusClient
}
