import type { Chain, Client, Hash, Transport } from "viem"
import {
  type SmartAccount,
  sendUserOperation,
  waitForUserOperationReceipt
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { type SigGenParameters, sigGen } from "./sigGen"

export async function sendTx<
  account extends SmartAccount | undefined,
  chain extends Chain | undefined
>(
  client: Client<Transport, chain, account>,
  parameters: SigGenParameters
): Promise<Hash> {
  const sigGenResponse = await getAction(client, sigGen, "sigGen")(parameters)

  const userOpHash = await getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
  )({
    ...sigGenResponse.preparedUserOperation,
    signature: sigGenResponse.signature
  })

  const userOperationReceipt = await getAction(
    client,
    waitForUserOperationReceipt,
    "waitForUserOperationReceipt"
  )({
    hash: userOpHash
  })

  return userOperationReceipt?.receipt.transactionHash
}
