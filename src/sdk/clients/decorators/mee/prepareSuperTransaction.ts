import type { Transport } from "viem"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { AnyData, ModularSmartAccount } from "../../../modules/utils/Types"
import type { MeeClient } from "../../createMeeClient"

export type PrepareSuperTransaction = AnyData

export type MeeRpcSchema = [
  {
    Method: "mee_prepareSuperTransaction"
    Parameters: []
    ReturnType: PrepareSuperTransaction
  }
]

export type PrepareSuperTransactionParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  accounts?: TModularSmartAccount[]
  testParam: number
}

export async function prepareSuperTransaction<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: MeeClient<Transport, ModularSmartAccount>,
  parameters: PrepareSuperTransactionParameters<TModularSmartAccount>
): Promise<PrepareSuperTransaction> {
  const { accounts: accounts_ = client.accounts, testParam } = parameters

  if (!accounts_?.length) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  // Do something in here...
  const paramsFromParameters = [testParam] as AnyData

  console.log({ accounts_, paramsFromParameters })

  return await client.request({
    method: "mee_prepareSuperTransaction",
    params: paramsFromParameters
  })
}
