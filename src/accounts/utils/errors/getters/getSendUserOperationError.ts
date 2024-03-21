import { type BaseError, UnknownNodeError } from "viem"
import { SendUserOperationError } from "../models"
import { getBundlerError } from "./getBundlerError"
import type { SendUserOperationParameters } from "../../../actions/sendUserOperation"

export async function getSendUserOperationError(
  err: BaseError,
  args: SendUserOperationParameters
) {
  const getCause = async () => {
    const cause = getBundlerError(
      err as BaseError,
      args as SendUserOperationParameters
    )
    if (cause instanceof UnknownNodeError) return err as BaseError
    return cause
  }

  const causeResult = await getCause()

  throw new SendUserOperationError(causeResult, {
    ...args
  })
}
