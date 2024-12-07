import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { Call } from "../../../account/utils/Types"
import type { AnyData, ModularSmartAccount } from "../../../modules/utils/Types"
import type { BaseMeeService } from "../../createMeeService"

export type GetFeeQuote = AnyData

export type MeeRpcSchema = [
  {
    Method: "mee_getFeeQuote"
    Parameters: []
    ReturnType: GetFeeQuote
  }
]

export type GetFeeQuoteParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  accounts?: TModularSmartAccount[]
  calls: Call[]
}

export async function getFeeQuote(
  client: BaseMeeService,
  parameters: GetFeeQuoteParameters<ModularSmartAccount>
): Promise<GetFeeQuote> {
  const { accounts: accounts_ = client.accounts, calls } = parameters

  if (!accounts_?.length) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const callData = await Promise.all(
    accounts_.map((account) => account.encodeCalls(calls))
  )

  return await client.request({
    method: "mee_getFeeQuote",
    params: callData
  })
}
