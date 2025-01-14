import type { Prettify } from "viem"
import type { AnyData } from "../modules"

/**
 * Parameters for initializing a Http client
 */
export type Url = `https://${string}` | `http://${string}`

/**
 * Parameters for making requests to the Http node
 */
type RequestParams = {
  /** API endpoint path */
  path: string
  /** HTTP method to use. Defaults to "POST" */
  method?: "GET" | "POST"
  /** Optional request body */
  body?: object
  /** Optional request params */
  params?: Record<string, string>
}

/**
 * Base interface for the Http client
 */
export type HttpClient = {
  /** Makes HTTP requests to the Http node */
  request: <T>(params: RequestParams) => Promise<T>
  /**
   * Extends the client with additional functionality
   * @param fn - Function that adds new properties/methods to the base client
   * @returns Extended client with both base and new functionality
   */
  extend: <
    const client extends Extended,
    const extendedHttpClient extends HttpClient
  >(
    fn: (base: extendedHttpClient) => client
  ) => client & extendedHttpClient
}

type Extended = Prettify<
  // disallow redefining base properties
  { [_ in keyof HttpClient]?: undefined } & {
    [key: string]: unknown
  }
>

/**
 * Creates a new Http client instance
 * @param params - Configuration parameters for the client
 * @returns A base Http client instance that can be extended with additional functionality
 */
export const createHttpClient = (url: Url): HttpClient => {
  const request = async <T>(requesParams: RequestParams) => {
    const { path, method = "POST", body, params } = requesParams
    const urlParams = params ? `?${new URLSearchParams(params)}` : ""
    const result = await fetch(`${url}/${path}${urlParams}`, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    })

    if (!result.ok) {
      throw new Error(result.statusText)
    }

    return (await result.json()) as T
  }

  const client = {
    request
  }

  function extend(base: typeof client) {
    type ExtendFn = (base: typeof client) => unknown
    return (extendFn: ExtendFn) => {
      const extended = extendFn(base) as Extended
      for (const key in client) delete extended[key]
      const combined = { ...base, ...extended }
      return Object.assign(combined, { extend: extend(combined as AnyData) })
    }
  }

  return Object.assign(client, { extend: extend(client) as AnyData })
}

export default createHttpClient
