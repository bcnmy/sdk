import {
  http,
  type Client,
  type ClientConfig,
  type CreateClientErrorType,
  type OneOf,
  type Prettify,
  type RpcSchema,
  type Transport,
  createClient
} from "viem"
import {
  type ToNexusSmartAccountParameters,
  toNexusAccount
} from "../account/toNexusAccount"
import { Logger } from "../account/utils/Logger"
import type { AnyData, ModularSmartAccount } from "../modules"
import { type MeeActions, meeActions } from "./decorators/mee"
import type { MeeRpcSchema } from "./decorators/mee/prepareSuperTransaction"

export const DEFAULT_MEE_NODE = "https://biconomy.io/mee"

export type ErrorType<name extends string = "Error"> = Error & { name: name }
export enum HttpMethod {
  Get = "get",
  Post = "post",
  Delete = "delete"
}
export interface HttpRequest {
  url: string
  method: HttpMethod
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  body?: Record<string, any>
}

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
  client?: client | Client
  transport?: transport
} & OneOf<
    | {
        /** Accounts to be used for the mee client */
        accounts: account[]
      }
    | {
        accountParams: ChainAbstractedAccountParams
      }
  >

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
): Promise<MeeClient<Transport, account>>

export async function createMeeClient(
  parameters: MeeClientConfig
): Promise<MeeClient> {
  const {
    accountParams: accountParams_,
    accounts,
    client: client_,
    key = "mee",
    name = "Mee Client",
    transport = http(DEFAULT_MEE_NODE)
  } = parameters

  let accounts_ = accounts
  if (!accounts_) {
    if (!accountParams_) throw new Error("No account params")
    accounts_ = await toAccounts(accountParams_)
  }

  const client = Object.assign(
    createClient({
      ...parameters,
      key,
      name,
      transport,
      type: "meeClient"
    }),
    {
      accounts: accounts_,
      client: client_,
      // Temporay while we wait for EIP1193 to be supported by meeNode
      // Can remove this when MEE node is EIP1193 compliant
      request: async <T>(
        body: Record<string, AnyData>,
        url = DEFAULT_MEE_NODE,
        method = HttpMethod.Post
      ) => {
        const stringifiedBody = JSON.stringify(body)
        Logger.log("HTTP Request", { url, body: stringifiedBody })

        const response = await fetch(url, {
          method,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: stringifiedBody
        })

        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        let jsonResponse: any
        try {
          jsonResponse = await response.json()
          Logger.log("HTTP Response", jsonResponse)
        } catch (error) {
          if (!response.ok) {
            throw new Error([response.statusText, response.status].join(", "))
          }
        }

        if (response.ok) {
          return jsonResponse as T
        }

        const errorFields = [
          "error",
          "message",
          "msg",
          "data",
          "detail",
          "nonFieldErrors"
        ]
        const firstError = errorFields.find((field) =>
          Boolean(jsonResponse[field])
        )
        if (firstError) {
          throw new Error([response.status, firstError].join(", "))
        }
        throw new Error([response.status, jsonResponse.statusText].join(", "))
      }
    }
  )

  return client.extend(meeActions) as MeeClient
}

export type ChainAbstractedAccountParams = Omit<
  ToNexusSmartAccountParameters,
  "transport" | "chain"
> & {
  chainList: {
    transport: ToNexusSmartAccountParameters["transport"]
    chain: ToNexusSmartAccountParameters["chain"]
  }[]
}
export const toAccounts = async (
  accountParams: ChainAbstractedAccountParams
): Promise<ModularSmartAccount[]> => {
  const { chainList, ...chainAgnosticParams } = accountParams
  return await Promise.all(
    chainList.map((params) =>
      toNexusAccount({ ...chainAgnosticParams, ...params })
    )
  )
}
