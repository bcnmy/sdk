import {
  type ActionData,
  type PolicyData,
  type Session,
  findTrustedAttesters,
  getTrustAttestersAction
} from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import { sendUserOperation } from "viem/account-abstraction"
import { encodeFunctionData, getAction, parseAccount } from "viem/utils"
import { ERROR_MESSAGES, Logger } from "../../../account"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { MOCK_ATTESTER_ADDRESS } from "../../../constants"
import {
  SIMPLE_SESSION_VALIDATOR_ADDRESS,
  SMART_SESSIONS_ADDRESS
} from "../../../constants"
import { SmartSessionAbi } from "../../../constants/abi/SmartSessionAbi"
import type { ModularSmartAccount } from "../../utils/Types"
import {
  applyDefaults,
  createActionConfig,
  createActionData,
  generateSalt,
  getPermissionId,
  toTimeRangePolicy,
  toUniversalActionPolicy
} from "../Helpers"
import type {
  CreateSessionDataParams,
  FullCreateSessionDataParams
} from "../Types"
import type {
  GrantPermissionActionReturnParams,
  GrantPermissionResponse
} from "../Types"

/**
 * Parameters for creating sessions in a modular smart account.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 */
export type GrantPermissionParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** Array of session data parameters for creating multiple sessions. */
  sessionRequestedInfo: CreateSessionDataParams[]
  /** The maximum fee per gas unit the transaction is willing to pay. */
  maxFeePerGas?: bigint
  /** The maximum priority fee per gas unit the transaction is willing to pay. */
  maxPriorityFeePerGas?: bigint
  /** The nonce of the transaction. If not provided, it will be determined automatically. */
  nonce?: bigint
  /** Optional public client for blockchain interactions. */
  publicClient?: PublicClient
  /** The modular smart account to create sessions for. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
  /** Optional attesters to trust. */
  attesters?: Hex[]
}

/**
 * Generates the action data for creating sessions in the SmartSessionValidator.
 *
 * @param sessionRequestedInfo - Array of session data parameters.
 * @param client - The public client for blockchain interactions.
 * @returns A promise that resolves to the action data and permission IDs, or an Error.
 */
export const getPermissionAction = async ({
  chainId,
  sessionRequestedInfo,
  client
}: {
  chainId: number
  sessionRequestedInfo: FullCreateSessionDataParams[]
  client: PublicClient
}): Promise<GrantPermissionActionReturnParams | Error> => {
  const sessions: Session[] = []
  const permissionIds: Hex[] = []

  // Start populating the session for each param provided
  for (const sessionInfo of sessionRequestedInfo) {
    const actionPolicies: ActionData[] = []
    for (const actionPolicyInfo of sessionInfo.actionPoliciesInfo) {
      // TODO: make it easy to generate rules for particular contract and selectors.
      const actionConfig = createActionConfig(
        actionPolicyInfo.rules ?? [],
        actionPolicyInfo.valueLimit
      )

      // one may also pass baked up policyData.

      // create uni action policy here..
      const uniActionPolicyData = toUniversalActionPolicy(actionConfig)
      // create time range policy here..
      const timeFramePolicyData: PolicyData = toTimeRangePolicy(
        actionPolicyInfo.validUntil ?? 0,
        actionPolicyInfo.validAfter ?? 0
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
      chainId: BigInt(chainId),
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

  const grantPermissionData = encodeFunctionData({
    abi: SmartSessionAbi,
    functionName: "enableSessions",
    args: [sessions]
  })

  return {
    action: {
      target: SMART_SESSIONS_ADDRESS,
      value: BigInt(0),
      callData: grantPermissionData
    },
    permissionIds: permissionIds
  }
}

/**
 * Adds multiple sessions to the SmartSessionValidator module of a given smart account.
 *
 * This function prepares and sends a user operation to create multiple sessions
 * for the specified modular smart account. Each session can have its own policies
 * and permissions.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 * @param client - The client used to interact with the blockchain.
 * @param parameters - Parameters including the smart account, required session specific policies info, and optional gas settings.
 * @returns A promise that resolves to an object containing the user operation hash and an array of permission IDs.
 *
 * @throws {AccountNotFoundError} If the account is not found.
 * @throws {Error} If there's an error getting the enable sessions action.
 *
 * @example
 * ```typescript
 * import { grantPermission } from '@biconomy/sdk'
 *
 * const result = await grantPermission(nexusClient, {
 *   sessionRequestedInfo: [
 *     {
 *       sessionKeyData: '0x...',
 *       actionPoliciesInfo: [
 *         {
 *           contractAddress: '0x...',
 *           functionSelector: '0x...',
 *           rules: [...],
 *           valueLimit: 1000000000000000000n
 *         }
 *       ],
 *       sessionValidUntil: 1234567890
 *     }
 *   ]
 * });
 * console.log(result.userOpHash); // '0x...'
 * console.log(result.permissionIds); // ['0x...', '0x...']
 * ```
 *
 * @remarks
 * - Ensure that the client has sufficient gas to cover the transaction.
 * - The number of sessions created is determined by the length of the `sessionRequestedInfo` array.
 * - Each session's policies and permissions are determined by the `actionPoliciesInfo` provided.
 */
export async function grantPermission<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters: GrantPermissionParameters<TModularSmartAccount>
): Promise<GrantPermissionResponse> {
  const {
    publicClient: publicClient_ = client.account?.client as PublicClient,
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    sessionRequestedInfo,
    attesters
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as ModularSmartAccount

  const chainId = publicClient_?.chain?.id

  if (!chainId) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  }

  const defaultedSessionRequestedInfo = sessionRequestedInfo.map(applyDefaults)

  const attestersToTrust = attesters ?? [MOCK_ATTESTER_ADDRESS]
  const actionResponse = await getPermissionAction({
    chainId,
    client: publicClient_,
    sessionRequestedInfo: defaultedSessionRequestedInfo
  })

  const trustAttestersAction = getTrustAttestersAction({
    attesters: attestersToTrust,
    threshold: attestersToTrust.length
  })

  const trustedAttesters = await findTrustedAttesters({
    client: publicClient_,
    accountAddress: account.address
  })

  const needToAddTrustAttesters = trustedAttesters.length === 0
  Logger.log("needToAddTrustAttesters", needToAddTrustAttesters)

  if (!("action" in actionResponse)) {
    throw new Error("Error getting enable sessions action")
  }

  const { action } = actionResponse

  if (!("callData" in action)) {
    throw new Error("Error getting enable sessions action")
  }

  if (!("callData" in trustAttestersAction)) {
    throw new Error("Error getting trust attesters action")
  }

  const calls = needToAddTrustAttesters
    ? [
        {
          to: trustAttestersAction.target,
          value: trustAttestersAction.value.valueOf(),
          data: trustAttestersAction.callData
        },
        {
          to: action.target,
          value: action.value,
          data: action.callData
        }
      ]
    : [
        {
          to: action.target,
          value: action.value,
          data: action.callData
        }
      ]

  if ("action" in actionResponse) {
    const userOpHash = (await getAction(
      client,
      sendUserOperation,
      "sendUserOperation"
    )({ calls, maxFeePerGas, maxPriorityFeePerGas, nonce, account })) as Hex

    return {
      userOpHash: userOpHash,
      permissionIds: actionResponse.permissionIds
    }
  }
  throw new Error("Error getting enable sessions action")
}
