import type { Transport } from "viem"
import { parseAccount } from "viem/accounts"
import { AccountNotFoundError } from "../../../../account/utils/AccountNotFound"
import type {
  AnyData,
  ModularSmartAccount
} from "../../../../modules/utils/Types"
import type { MeeClient } from "../../../createMeeClient"

export type MeeActionResponse = AnyData

export type MeeRpcSchema = [
  {
    Method: "mee_action"
    Parameters: []
    ReturnType: MeeActionResponse
  }
]

export type MeeActionParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  accounts?: TModularSmartAccount[]
  testParam: number
}

export async function meeAction<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: MeeClient<Transport, ModularSmartAccount>,
  parameters: MeeActionParameters<TModularSmartAccount>
): Promise<MeeActionResponse> {
  const { accounts: accounts_ = client.accounts, testParam } = parameters

  if (!accounts_?.length) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const accounts = accounts_.map((account) => parseAccount(account))
  console.log({ accounts })

  // Do something in here...
  const paramsFromParameters = [testParam] as AnyData

  return await client.request({
    method: "mee_action",
    params: paramsFromParameters
  })
}
