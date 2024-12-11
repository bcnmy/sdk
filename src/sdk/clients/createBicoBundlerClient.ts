import {
  http,
  type BundlerRpcSchema,
  type Chain,
  type Client,
  type OneOf,
  type Prettify,
  type RpcSchema,
  type Transport
} from "viem"
import {
  type BundlerActions,
  type BundlerClientConfig,
  type PaymasterActions,
  type SmartAccount,
  createBundlerClient
} from "viem/account-abstraction"
import { type BicoActions, bicoBundlerActions } from "./decorators/bundler"
import type {
  BicoRpcSchema,
  GetGasFeeValuesReturnType
} from "./decorators/bundler/getGasFeeValues"
import { biconomySponsoredPaymasterContext } from "./createBicoPaymasterClient"

export type BicoBundlerClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartAccount | undefined = SmartAccount | undefined,
  client extends Client | undefined = Client | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Client<
    transport,
    chain extends Chain
    ? chain
    : // biome-ignore lint/suspicious/noExplicitAny: We need any to infer the chain type
    client extends Client<any, infer chain>
    ? chain
    : undefined,
    account,
    rpcSchema extends RpcSchema
    ? [...BundlerRpcSchema, ...BicoRpcSchema, ...rpcSchema]
    : [...BundlerRpcSchema, ...BicoRpcSchema],
    BundlerActions<account> & PaymasterActions & BicoActions
  >
>

type BicoBundlerClientConfig = Omit<BundlerClientConfig, "transport"> &
  OneOf<
    | {
      transport: Transport
    }
    | {
      bundlerUrl: string
    }
    | {
      apiKey?: string
    }
  >

/**
 * Creates a Bico Bundler Client with a given Transport configured for a Chain.
 *
 * @param parameters - Configuration for the Bico Bundler Client
 * @returns A Bico Bundler Client
 *
 * @example
 * import { createBicoBundlerClient, http } from '@biconomy/sdk'
 * import { mainnet } from 'viem/chains'
 *
 * const bundlerClient = createBicoBundlerClient({ chain: mainnet });
 */
export const createBicoBundlerClient = (
  parameters: BicoBundlerClientConfig
): BicoBundlerClient => {
  if (
    !parameters.apiKey &&
    !parameters.bundlerUrl &&
    !parameters.transport &&
    !parameters?.chain
  ) {
    throw new Error(
      "Cannot set determine a bundler url, please provide a chain."
    )
  }

  const defaultedTransport = parameters.transport
    ? parameters.transport
    : parameters.bundlerUrl
      ? http(parameters.bundlerUrl)
      : http(
        // @ts-ignore: Type saftey provided by the if statement above
        `https://bundler.biconomy.io/api/v3/${parameters.chain.id}/${parameters.apiKey ??
        "nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14"
        }`
      )

  const defaultedUserOperation = parameters.userOperation ?? {
    estimateFeesPerGas: async (_) => {
      const gasFees: GetGasFeeValuesReturnType =
        await bundler_.getGasFeeValues()
      return gasFees.fast
    }
  }

  const defaultedPaymasterContext = parameters.paymaster
    ? parameters.paymasterContext ?? biconomySponsoredPaymasterContext
    : undefined

  const bundler_ = createBundlerClient({
    ...parameters,
    transport: defaultedTransport,
    paymasterContext: defaultedPaymasterContext,
    userOperation: defaultedUserOperation
  }).extend(bicoBundlerActions())

  return bundler_ as BicoBundlerClient
}
