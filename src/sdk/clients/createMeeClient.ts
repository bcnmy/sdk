import {
  http,
  type Client,
  type ClientConfig,
  type CreateClientErrorType,
  type Prettify,
  type RpcSchema,
  type Transport,
  createClient
} from "viem"
import type { AnyData, ModularSmartAccount } from "../modules"
import { HttpMethod, httpRequest } from "./decorators/mee/Helpers"
import { type MeeActions, meeActions } from "./decorators/mee/decorators"
import type { MeeRpcSchema } from "./decorators/mee/decorators/meeAction"

export const DEFAULT_MEE_NODE = "https://biconomy.io/mee"

export type ErrorType<name extends string = "Error"> = Error & { name: name }

export type MeeClientConfig<
  transport extends Transport | undefined = Transport | undefined,
  account extends ModularSmartAccount = ModularSmartAccount,
  client extends Client | undefined = Client | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Pick<
    ClientConfig<Transport, undefined, account, rpcSchema>,
    "account" | "cacheTime" | "key" | "name" | "pollingInterval" | "rpcSchema"
  >
> & {
  /** Client that points to an Execution RPC URL. */
  client?: client | Client
  transport?: transport
  /** Accounts to be used for the mee client */
  accounts: account[]
}

export type MeeClient<
  transport extends Transport = Transport,
  account extends ModularSmartAccount = ModularSmartAccount,
  client extends Client | undefined = Client | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Client<
    transport,
    never,
    account,
    rpcSchema extends RpcSchema
      ? [...MeeRpcSchema, ...rpcSchema]
      : MeeRpcSchema,
    MeeActions
  >
> & {
  client: client
  accounts: account[]
}

export type CreateMeeClientErrorType = CreateClientErrorType | ErrorType

export function createMeeClient<
  account extends ModularSmartAccount = ModularSmartAccount,
  transport extends Transport | undefined = Transport | undefined,
  client extends Client | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined
>(
  parameters: MeeClientConfig<transport, account>
): MeeClient<Transport, account>

export function createMeeClient(parameters: MeeClientConfig): MeeClient {
  const {
    accounts,
    client: client_,
    key = "mee",
    name = "Mee Client",
    transport = http(DEFAULT_MEE_NODE)
  } = parameters

  const client = Object.assign(
    createClient({
      ...parameters,
      key,
      name,
      transport,
      type: "meeClient"
    }),
    {
      accounts,
      client: client_,
      // Temporay while we wait for EIP1193 to be supported by meeNode
      // Can remove this when MEE node is EIP1193 compliant
      request: (body: Record<string, AnyData>) => {
        console.log("request body", body)
        return httpRequest({
          url: DEFAULT_MEE_NODE,
          method: HttpMethod.Post,
          body
        })
      }
    }
  )

  return client.extend(meeActions) as MeeClient
}
