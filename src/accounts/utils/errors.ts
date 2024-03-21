import { BaseError } from "viem"
import { buildErrorStrings, prettyPrint } from "./helpers"
import type { ErrorType, UserOperationStruct } from "./types"

export type UnknownNodeErrorType = UnknownNodeError & {
  name: "UnknownNodeError"
}
export class UnknownNodeError extends BaseError {
  override name = "UnknownNodeError"

  constructor({ cause }: { cause?: BaseError }) {
    super(`An error occurred while executing: ${cause?.shortMessage}`, {
      cause
    })
  }
}

export type ExecutionRevertedErrorType = ExecutionRevertedError & {
  code: 3
  name: "ExecutionRevertedError"
}
export class ExecutionRevertedError extends BaseError {
  static code = 3
  static nodeMessage = /execution reverted/

  override name = "ExecutionRevertedError"

  constructor({
    cause,
    message
  }: { cause?: BaseError; message?: string } = {}) {
    const reason = message
      ?.replace("execution reverted: ", "")
      ?.replace("execution reverted", "")
    super(
      `Execution reverted ${
        reason ? `with reason: ${reason}` : "for an unknown reason"
      }.`,
      {
        cause
      }
    )
  }
}

export type SendUserOperationErrorType = SendUserOperationError & {
  name: "SendUserOperationError"
}
export class SendUserOperationError extends BaseError {
  override cause: BaseError

  override name = "SendUserOperationError"

  constructor(
    cause: BaseError,
    {
      userOperation,
      docsPath
    }: { userOperation: UserOperationStruct; docsPath?: string }
  ) {
    const prettyArgs = prettyPrint({
      sender: userOperation.sender,
      nonce: userOperation.nonce,
      initCode: userOperation.initCode,
      callData: userOperation.callData,
      callGasLimit: userOperation.callGasLimit,
      verificationGasLimit: userOperation.verificationGasLimit,
      preVerificationGas: userOperation.preVerificationGas,
      maxFeePerGas: userOperation.maxFeePerGas,
      maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
      paymasterAndData: userOperation.paymasterAndData,
      signature: userOperation.signature
    })

    super(cause.shortMessage, {
      cause,
      docsPath,
      metaMessages: [
        ...(cause.metaMessages ? [...cause.metaMessages, " "] : []),
        "sendUserOperation Arguments:",
        prettyArgs
      ].filter(Boolean) as string[]
    })
    this.cause = cause
  }
}

export async function getSendUserOperationError(
  err: BaseError,
  args: { userOperation: any }
) {
  // fetch the errors from https://bcnmy.github.io/aa-errors/errors.json
  const rawErrorRequest = await fetch(
    "https://bcnmy.github.io/aa-errors/errors.json"
  )
  const errors = await rawErrorRequest.json()

  const cause = (() => {
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

    // match the message against the errors at: https://bcnmy.github.io/aa-errors/errors.json
    const matchedError: ErrorType | undefined = message
      ? errors.find((error: ErrorType) =>
          new RegExp(message, "i").test(error.regex)
        )
      : undefined

    if (matchedError) {
      return new BaseError(matchedError.name, {
        cause: err,
        metaMessages: buildErrorStrings(matchedError)
      })
    }

    return new UnknownNodeError({ cause: err }) as UnknownNodeErrorType
  })()

  throw new SendUserOperationError(cause, { ...args })
}
