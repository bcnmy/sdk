import {
  type SmartAccountActions,
  type SmartAccountClientConfig,
  smartAccountActions
} from "permissionless"

import { type Chain, type Client, type Transport, createClient } from "viem"
import { type Prettify } from "viem/chains"

import {
  type ENTRYPOINT_ADDRESS_V07_TYPE,
  type SmartAccount
} from "../account/utils/types.js"
import { type BundlerRpcSchema } from "../bundler/utils/types.js"

export type SmartAccountClient<
  entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartAccount<entryPoint> | undefined =
    | SmartAccount<entryPoint>
    | undefined
> = Prettify<
  Client<
    transport,
    chain,
    account,
    BundlerRpcSchema<entryPoint>,
    SmartAccountActions<entryPoint, chain, account>
  >
>

/**
 * Creates a EIP-4337 compliant Bundler Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/clients/smartAccountClient
 *
 * A Bundler Client is an interface to "erc 4337" [JSON-RPC API](https://eips.ethereum.org/EIPS/eip-4337#rpc-methods-eth-namespace) methods such as sending user operation, estimating gas for a user operation, get user operation receipt, etc through Bundler Actions.
 *
 * @param parameters - {@link WalletClientConfig}
 * @returns A Bundler Client. {@link SmartAccountClient}
 *
 * @example
 * import { createPublicClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const smartAccountClient = createSmartAccountClient({
 *   chain: mainnet,
 *   transport: http(BUNDLER_URL),
 * })
 */

export function createSmartAccountClient<
  TSmartAccount extends SmartAccount<ENTRYPOINT_ADDRESS_V07_TYPE>,
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain
>(
  parameters: SmartAccountClientConfig<
    ENTRYPOINT_ADDRESS_V07_TYPE,
    TTransport,
    TChain,
    TSmartAccount
  >
): SmartAccountClient<
  ENTRYPOINT_ADDRESS_V07_TYPE,
  TTransport,
  TChain,
  TSmartAccount
> {
  const {
    key = "Account",
    name = "Smart Account Client",
    bundlerTransport
  } = parameters
  const client = createClient({
    ...parameters,
    key,
    name,
    transport: bundlerTransport,
    type: "smartAccountClient"
  })

  return client.extend(
    smartAccountActions({
      middleware: parameters.middleware
    })
  ) as SmartAccountClient<
    ENTRYPOINT_ADDRESS_V07_TYPE,
    TTransport,
    TChain,
    TSmartAccount
  >
}
