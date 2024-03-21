import { BaseError } from "viem"
import type { SendUserOperationParameters } from "../../../actions/sendUserOperation"
import {
  ExecutionRevertedError,
  UnknownNodeError,
  type ExecutionRevertedErrorType,
  type UnknownNodeErrorType
} from "../models"
import type { KnownError } from "../../types"
import { buildErrorStrings } from "../helpers"

const ERRORS_URL = "https://bcnmy.github.io/aa-errors/errors.json"
const DOCS_URL = "https://docs.biconomy.io/troubleshooting/commonerrors"

export const getBundlerError = async (
  err: BaseError,
  args: SendUserOperationParameters
) => {
  let errors: KnownError[] = []

  try {
    errors = await (await fetch(ERRORS_URL)).json()
  } catch (_) {}

  const message = (err.details || "").toLowerCase()

  const executionRevertedError =
    err instanceof BaseError
      ? err.walk(
          (e) => (e as { code: number }).code === ExecutionRevertedError.code
        )
      : err

  if (executionRevertedError instanceof BaseError) {
    return new ExecutionRevertedError({
      cause: err,
      message: executionRevertedError.details
    }) as ExecutionRevertedErrorType
  }

  // TODO: Add validation Errors
  if (args.userOperation.sender === undefined)
    return new UnknownNodeError({ cause: err })
  if (args.userOperation.nonce === undefined)
    return new UnknownNodeError({ cause: err })

  const matchedError: KnownError | undefined = message
    ? errors.find((error: KnownError) =>
        new RegExp(message, "i").test(error.regex)
      )
    : undefined

  if (matchedError) {
    return new BaseError(matchedError.name, {
      cause: err,
      metaMessages: buildErrorStrings(matchedError),
      docsPath: DOCS_URL
    })
  }

  return new UnknownNodeError({ cause: err }) as UnknownNodeErrorType
}
