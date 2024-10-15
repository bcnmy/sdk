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
import contracts from "../__contracts"

import type { NexusAccount } from "../account/toNexusAccount"
import type { ToValidationModuleReturnType } from "../modules/validators/toValidationModule"
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
      : client extends Client<any, infer chain>
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
  account extends SmartAccount | undefined = SmartAccount | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Pick<
    ClientConfig<transport, chain, account, rpcSchema>,
    "cacheTime" | "chain" | "key" | "name" | "pollingInterval" | "rpcSchema"
  > & {
    account: NexusAccount
    /** RPC URL. */
    // transport: transport
    /** Bundler URL. */
    bundlerTransport: transport
    /** Client that points to an Execution RPC URL. */
    // client?: client | Client | undefined
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
                account: account | SmartAccount
                bundlerClient: Client
                userOperation: UserOperationRequest
              }) => Promise<EstimateFeesPerGasReturnType<"eip1559">>)
            | undefined
        }
      | undefined
    /** Owner of the account. */
    // signer: UnknownSigner
    /** Index of the account. */
    index?: bigint
    /** Active module of the account. */
    activeModule?: ToValidationModuleReturnType
    /** Factory address of the account. */
    factoryAddress?: Address
    /** Owner module */
    k1ValidatorAddress?: Address
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
    account,
    index = 0n,
    key = "nexus client",
    name = "Nexus Client",
    activeModule,
    bundlerTransport,
    ...bundlerConfig
  } = parameters

  if (!account.client.chain) throw new Error("Missing chain")

  if (activeModule) account.setActiveModule(activeModule)

  const bundler_ = createBicoBundlerClient({
    ...bundlerConfig,
    chain: account.client.chain,
    key,
    name,
    account,
    transport: bundlerTransport
  })
    .extend(erc7579Actions())
    .extend(smartAccountActions())

  return bundler_ as unknown as NexusClient
}
