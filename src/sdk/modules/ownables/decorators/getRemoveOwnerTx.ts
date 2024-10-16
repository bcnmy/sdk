import { getRemoveOwnableValidatorOwnerAction } from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { Call } from "../../../account/utils/Types"

export type GetRemoveOwnerTxParameters<TSmartAccount> = {
  account?: TSmartAccount
  owner: Hex
}

export async function getRemoveOwnerTx<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: GetRemoveOwnerTxParameters<TSmartAccount>
): Promise<Call> {
  const { account: account_ = client.account, owner } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount
  const publicClient = account.client

  if (!publicClient) {
    throw new Error("Public client not found")
  }

  const action = await getRemoveOwnableValidatorOwnerAction({
    account: { address: account.address, deployedOnChains: [], type: "nexus" },
    client: publicClient as PublicClient,
    owner
  })

  if (!("callData" in action)) {
    throw new Error("Error getting remove owner action")
  }

  return {
    to: action.target,
    value: BigInt(action.value.toString()),
    data: action.callData
  }
}
