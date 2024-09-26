import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import {
  type GetSmartAccountParameter,
  type SmartAccount,
  sendUserOperation
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import addresses from "../../../../__contracts/addresses"
import { AccountNotFoundError } from "../../../../account/utils/AccountNotFound"
import { type CreateSessionDataParams } from "../../../utils/Types"
import { type Account, type Execution } from "@rhinestone/module-sdk"
// Review: Execution type could either be used from our sdk or from module-sdk

export type EnableSessionsParameters<TSmartAccount extends SmartAccount | undefined> =
  GetSmartAccountParameter<TSmartAccount> & {
    sessionRequestedInfo: CreateSessionDataParams[]
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    nonce?: bigint
    signatureOverride?: Hex
}

// Note: WIP writing our own helper action for enabling sessions for USE mode.
export const getSmartSessionValidatorEnableSessionsAction = async ({
    sessionRequestedInfo,
    client,
    account, // TODO: review type
  }: {
    sessionRequestedInfo: CreateSessionDataParams[]
    client: PublicClient
    account: Account // TODO: review type
  }): Promise<Execution | Error> => {
    console.log("sessionRequestedInfo", sessionRequestedInfo)
    console.log("client", client)
    console.log("account", account)
    // Temp
    return {
      target: addresses.SmartSession,
      value: BigInt(0),
      callData: '0x',
    }
}

/**
 * Adds n amount of sessions to the SmartSessionValidator module of a given smart account.
 *
 * @param client - The client instance.
 * @param parameters - Parameters including the smart account, required session specific policies info, and optional gas settings.
 * @returns The hash of the user operation as a hexadecimal string.
 * @throws {AccountNotFoundError} If the account is not found.
 *
 * @example
 * import { enableSessions } from '@biconomy/sdk'
 *
 * const userOpHash = await enableSessions(nexusClient, {
 *   sessionRequestedInfo: '0x...'
 * })
 * console.log(userOpHash) // '0x...'
 */
export async function enableSessions<TSmartAccount extends SmartAccount | undefined>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: EnableSessionsParameters<TSmartAccount>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    sessionRequestedInfo,
    signatureOverride
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/docs/actions/wallet/sendTransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount
  const publicClient = account.client

  const action = await getSmartSessionValidatorEnableSessionsAction({
    account: { address: account.address, deployedOnChains: [], type: "nexus" },
    client: publicClient as any,
    sessionRequestedInfo
  })

  if (!("callData" in action)) {
    throw new Error("Error getting enable sessions action")
  }

  return getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
  )({
    calls: [
      {
        to: action.target,
        value: BigInt(action.value.toString()),
        data: action.callData
      }
    ],
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    account,
    signature: signatureOverride
  })
}

