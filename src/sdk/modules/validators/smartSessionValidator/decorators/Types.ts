import type { Hex } from "viem"
import type { Execution } from "../../../utils/Types"

export type CreateSessionsActionReturnParams = {
  permissionIds: Hex[]
  action: Execution
}

export type CreateSessionsResponse = {
  userOpHash: Hex
  permissionIds: Hex[]
}
