import { Logger } from "../../../account/utils/Logger"

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

export async function httpRequest<T>({
  url,
  method,
  body
}: HttpRequest): Promise<T> {
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
  if (jsonResponse.error) {
    throw new Error(jsonResponse.error.message)
  }
  if (jsonResponse.message) {
    throw new Error([response.status, jsonResponse.message].join(", "))
  }
  if (jsonResponse.msg) {
    throw new Error([response.status, jsonResponse.msg].join(", "))
  }
  if (jsonResponse.data) {
    throw new Error([response.status, jsonResponse.data].join(", "))
  }
  if (jsonResponse.detail) {
    throw new Error([response.status, jsonResponse.detail].join(", "))
  }
  if (jsonResponse.message) {
    throw new Error([response.status, jsonResponse.message].join(", "))
  }
  if (jsonResponse.nonFieldErrors) {
    throw new Error([response.status, jsonResponse.nonFieldErrors].join(", "))
  }
  if (jsonResponse.delegate) {
    throw new Error([response.status, jsonResponse.delegate].join(", "))
  }
  throw new Error([response.status, jsonResponse.statusText].join(", "))
}
