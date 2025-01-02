export type KnownError = {
  name: string
  regex: string
  description: string
  causes: string[]
  solutions: string[]
  docsUrl?: string
}

export const ERRORS_URL =
  "https://raw.githubusercontent.com/bcnmy/aa-errors/main/docs/errors.json"
export const DOCS_URL = "https://docs.biconomy.io/troubleshooting/commonerrors"
const UNKOWN_ERROR_CODE = "520"

const knownErrors: KnownError[] = []

const matchError = (message: string): null | KnownError =>
  knownErrors.find(
    (knownError: KnownError) =>
      message.toLowerCase().indexOf(knownError.regex.toLowerCase()) > -1
  ) ?? null

const buildErrorStrings = (error: KnownError, status: string): string[] => {
  const strings: string[] = []

  strings.push(`${status}: ${error.description}`)

  if (error.causes?.length) {
    strings.push("Potential cause(s):")
    strings.push(...error.causes)
  }

  if (error.solutions?.length) {
    strings.push("Potential solution(s):")
    strings.push(...error.solutions)
  }

  return strings
}

export const getAAError = async (message: string, httpStatus?: number) => {
  if (!knownErrors.length) {
    const errors = (await (await fetch(ERRORS_URL)).json()) as KnownError[]
    knownErrors.push(...errors)
  }

  const matchedError = matchError(message)
  const status =
    matchedError?.regex ?? (httpStatus ?? UNKOWN_ERROR_CODE).toString()

  const metaMessages = matchedError
    ? buildErrorStrings(matchedError, status)
    : []
  const title = matchedError ? matchedError.name : "Unknown Error"
  const docsSlug = matchedError?.docsUrl ?? DOCS_URL

  return { title, docsSlug, metaMessages, message }
}
