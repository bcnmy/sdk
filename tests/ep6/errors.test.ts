import { BaseError } from "viem"
import { beforeAll, describe, test } from "vitest"
import { getSendUserOperationError } from "../../src/accounts/utils/errors"

describe("Errors", () => {
  beforeAll(async () => {})

  test("Should test errors", async () => {
    const test = await getSendUserOperationError(
      new BaseError("oops", {
        docsPath: "",
        docsSlug: "",
        metaMessages: [],
        cause: new Error("aa33")
      }),
      {
        userOperation: {
          sender: "0x123",
          nonce: "0x",
          callData: "0x123",
          callGasLimit: "0x",
          verificationGasLimit: "0x",
          preVerificationGas: "0x",
          maxFeePerGas: "0x",
          maxPriorityFeePerGas: "0x",
          signature: "0x123"
        }
      }
    )

    console.log({ test })
  })
})
