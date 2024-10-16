import type { Execution } from "@rhinestone/module-sdk/account"
import type { Chain, Client, Hex, Transport } from "viem"
import { type SmartAccount, sendUserOperation } from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import type { NexusAccount } from "../../../account/toNexusAccount"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"

// If the session is enabled for multiple actions, it is possible to send a batch transaction. hence it accepts an array of executions.
// permisisonId corresponds to already enabled session.
export type UseSessionParameters<
  TSmartAccount extends SmartAccount | undefined
> = {
  actions: Execution[]
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: bigint
  account?: TSmartAccount
}

export async function useSession<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: UseSessionParameters<TSmartAccount>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    actions
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as NexusAccount

  return await getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
  )({
    calls: actions.map((action) => ({
      to: action.target,
      value: BigInt(action.value.toString()),
      data: action.callData
    })),
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    account
  })
}
