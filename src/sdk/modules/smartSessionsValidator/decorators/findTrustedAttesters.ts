import { getAccount } from "@rhinestone/module-sdk"
import type { Address, Chain, Client, PublicClient, Transport } from "viem"
import { parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { ModularSmartAccount } from "../../utils/Types"
import { getTrustedAttesters } from "../Helpers"

/**
 * Parameters for retrieving the attesters of a smart account.
 *
 * @template TModularSmartAccount - The type of the smart account, which can be a ModularSmartAccount or undefined.
 */
export type FindTrustedAttestersParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** The smart account to get the attesters for. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
}

/**
 * Retrieves the list of attesters for a smart account.
 *
 * This function fetches the current attesters of the specified smart account.
 *
 * @template TModularSmartAccount - The type of the smart account, which can be a ModularSmartAccount or undefined.
 * @param client - The client used to interact with the blockchain.
 * @param parameters - The parameters for retrieving the attesters. If not provided, defaults will be used.
 * @returns A promise that resolves to an array of addresses representing the attesters of the account.
 * @throws {AccountNotFoundError} If no account is provided and the client doesn't have an associated account.
 * @throws {Error} If the public client is not found.
 */
export async function findTrustedAttesters<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters?: FindTrustedAttestersParameters<TModularSmartAccount>
): Promise<Address[]> {
  const { account: account_ = client.account } = parameters ?? {}

  // Review docspath below.
  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as ModularSmartAccount
  const publicClient = account?.client as PublicClient

  if (!publicClient) {
    throw new Error("Public client not found")
  }

  const nexusAccount = getAccount({
    address: account.address,
    type: "nexus"
  })

  return getTrustedAttesters({
    accountAddress: nexusAccount.address,
    client: publicClient as PublicClient
  })
}
