import type { Hex } from "viem"
import type { Execution } from "../../../utils/Types"

export type EnableSessionsActionReturnParams = {
  permissionIds: Hex[]
  action: Execution
}

export type EnableSessionsResponse = {
  userOpHash: Hex
  permissionIds: Hex[]
}
