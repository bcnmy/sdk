import {
  getAccount,
  getAddOwnableValidatorOwnerAction
} from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { Call } from "../../../account/utils/Types"

export type GetAddOwnerTxParameters<
  TSmartAccount extends SmartAccount | undefined
> = {
  account?: TSmartAccount
  owner: Hex
}

export async function getAddOwnerTx<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: GetAddOwnerTxParameters<TSmartAccount>
): Promise<Call> {
  const { account: account_ = client.account, owner } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount
  const publicClient = account.client as PublicClient

  if (!publicClient) {
    throw new Error("Public client not found")
  }

  const nexusAccount = getAccount({
    address: account.address,
    type: "nexus"
  })

  const action = await getAddOwnableValidatorOwnerAction({
    account: nexusAccount,
    client: publicClient,
    owner
  })

  if (!("callData" in action)) {
    throw new Error("Error getting set threshold actions")
  }

  return {
    to: action.target,
    value: BigInt(action.value.toString()),
    data: action.callData
  }
}
