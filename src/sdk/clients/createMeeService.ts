import type { OneOf, Prettify } from "viem"
import {
  type ToNexusSmartAccountParameters,
  toNexusAccount
} from "../account/toNexusAccount"
import { Logger } from "../account/utils/Logger"
import type { AnyData, ModularSmartAccount } from "../modules"
import { type MeeActions, meeActions } from "./decorators/mee"

export const DEFAULT_MEE_NODE = "https://mee-node.biconomy.io"

export enum HttpMethod {
  Get = "get",
  Post = "post",
  Delete = "delete"
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

export type MeeServiceParameters = {
  baseUrl?: string
} & OneOf<
  | {
      accounts: ModularSmartAccount[]
    }
  | {
      accountParams: ChainAbstractedAccountParams
    }
>
export type ResolvedMeeServiceParameters = {
  baseUrl?: string
  accounts: ModularSmartAccount[]
}

export type TBaseMeeService = Omit<BaseMeeService, "init" | "prototype">
export type MeeService = Prettify<TBaseMeeService & MeeActions>

export class BaseMeeService {
  private baseUrl: string
  public accounts: ModularSmartAccount[]

  constructor(config: ResolvedMeeServiceParameters) {
    this.baseUrl = config.baseUrl || DEFAULT_MEE_NODE
    this.accounts = config.accounts || []
  }

  async request<T>(
    body: Record<string, AnyData>,
    url = this.baseUrl,
    method = HttpMethod.Post
  ): Promise<T> {
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

    let jsonResponse: unknown
    try {
      jsonResponse = await response.json()
      Logger.log("HTTP Response", jsonResponse)
    } catch (error) {
      if (!response.ok) {
        throw new Error(`${response.statusText}, ${response.status}`)
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
      Boolean((jsonResponse as Record<string, unknown>)[field])
    )
    if (firstError) {
      throw new Error(`${response.status}, ${firstError}`)
    }
    throw new Error(`${response.status}, ${(response as AnyData).statusText}`)
  }

  static async init(config: MeeServiceParameters): Promise<MeeService> {
    let accounts: ModularSmartAccount[] = config.accounts || []
    if (!config.accounts && config.accountParams) {
      const { chainList, ...chainAgnosticParams } = config.accountParams
      accounts = await Promise.all(
        chainList.map((params) =>
          toNexusAccount({ ...chainAgnosticParams, ...params })
        )
      )
    }
    if (!accounts) {
      throw new Error("No accounts provided")
    }
    const baseAgent = new BaseMeeService({ baseUrl: config.baseUrl, accounts })
    return Object.assign(baseAgent, meeActions(baseAgent)) as MeeService
  }
}

// Helper function to create a MeeService instance
export const createMeeService = BaseMeeService.init
