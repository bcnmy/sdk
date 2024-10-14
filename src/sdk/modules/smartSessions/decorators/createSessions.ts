import type { ActionData, PolicyData, Session } from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import { type SmartAccount, sendUserOperation } from "viem/account-abstraction"
import { encodeFunctionData, getAction, parseAccount } from "viem/utils"
import { SmartSessionAbi } from "../../../__contracts/abi/SmartSessionAbi"
import addresses from "../../../__contracts/addresses"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import {
  createActionConfig,
  createActionData,
  generateSalt,
  getPermissionId,
  toTimeRangePolicy,
  toUniversalActionPolicy
} from "../Helpers"
import type { CreateSessionDataParams } from "../Types"
import type {
  CreateSessionsActionReturnParams,
  CreateSessionsResponse
} from "../Types"
// Review: Execution type could either be used from our sdk or from module-sdk

const SIMPLE_SESSION_VALIDATOR_ADDRESS = addresses.SimpleSessionValidator

export type CreateSessionsParameters<
  TSmartAccount extends SmartAccount | undefined
> = {
  sessionRequestedInfo: CreateSessionDataParams[]
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: bigint
  publicClient?: PublicClient
  account?: TSmartAccount
}

export const getSmartSessionValidatorCreateSessionsAction = async ({
  sessionRequestedInfo,
  client
}: {
  sessionRequestedInfo: CreateSessionDataParams[]
  client: PublicClient
}): Promise<CreateSessionsActionReturnParams | Error> => {
  const sessions: Session[] = []
  const permissionIds: Hex[] = []

  // Start populating the session for each param provided
  for (const sessionInfo of sessionRequestedInfo) {
    const actionPolicies: ActionData[] = []
    for (const actionPolicyInfo of sessionInfo.actionPoliciesInfo) {
      // TODO: make it easy to generate rules for particular contract and selectors.
      const actionConfig = createActionConfig(
        actionPolicyInfo.rules,
        actionPolicyInfo.valueLimit
      )

      // one may also pass baked up policyData.

      // create uni action policy here..
      const uniActionPolicyData = toUniversalActionPolicy(actionConfig)
      // create time range policy here..
      const timeFramePolicyData: PolicyData = toTimeRangePolicy(
        actionPolicyInfo.validUntil,
        actionPolicyInfo.validAfter
      )

      // Create ActionData
      const actionPolicy = createActionData(
        actionPolicyInfo.contractAddress,
        actionPolicyInfo.functionSelector,
        [uniActionPolicyData, timeFramePolicyData]
      )

      actionPolicies.push(actionPolicy)
    }

    const userOpTimeFramePolicyData: PolicyData = toTimeRangePolicy(
      sessionInfo.sessionValidUntil ?? 0,
      sessionInfo.sessionValidAfter ?? 0
    )

    const session: Session = {
      sessionValidator:
        sessionInfo.sessionValidatorAddress ?? SIMPLE_SESSION_VALIDATOR_ADDRESS,
      sessionValidatorInitData: sessionInfo.sessionKeyData, // sessionValidatorInitData: abi.encodePacked(sessionSigner.addr),
      salt: sessionInfo.salt ?? generateSalt(),
      userOpPolicies: [userOpTimeFramePolicyData],
      actions: actionPolicies,
      erc7739Policies: {
        allowedERC7739Content: [],
        erc1271Policies: []
      }
    }

    const permissionId = (await getPermissionId({
      client: client,
      session: session
    })) as Hex
    // push permissionId to the array
    permissionIds.push(permissionId)

    // Push to sessions array
    sessions.push(session)
  }

  const createSessionsData = encodeFunctionData({
    abi: SmartSessionAbi,
    functionName: "enableSessions",
    args: [sessions]
  })

  return {
    action: {
      target: addresses.SmartSession,
      value: BigInt(0),
      callData: createSessionsData
    },
    permissionIds: permissionIds
  }
}

/**
 * Adds n amount of sessions to the SmartSessionValidator module of a given smart account.
 *
 * @param client - The client instance.
 * @param parameters - Parameters including the smart account, required session specific policies info, and optional gas settings.
 * @returns The hash of the user operation as a hexadecimal string.
 * @returns An array of permission ids corresponding to the sessions enabled.
 * @throws {AccountNotFoundError} If the account is not found.
 *
 * @example
 * import { createSessions } from '@biconomy/sdk'
 *
 * const userOpHash = await createSessions(nexusClient, {
 *   sessionRequestedInfo: '0x...'
 * })
 * console.log(userOpHash) // '0x...'
 */
export async function createSessions<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: CreateSessionsParameters<TSmartAccount>
): Promise<CreateSessionsResponse> {
  const {
    publicClient: publicClient_ = client.account?.client as PublicClient,
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    sessionRequestedInfo
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount

  const actionResponse = await getSmartSessionValidatorCreateSessionsAction({
    client: publicClient_,
    sessionRequestedInfo
  })

  if ("action" in actionResponse) {
    const { action } = actionResponse
    if (!("callData" in action)) {
      throw new Error("Error getting enable sessions action")
    }

    const userOpHash = (await getAction(
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
      account
    })) as Hex

    return {
      userOpHash: userOpHash,
      permissionIds: actionResponse.permissionIds
    }
  }
  throw new Error("Error getting enable sessions action")
}
