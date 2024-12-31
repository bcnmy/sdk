import {
  getTimeFramePolicy,
  getUniversalActionPolicy
} from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import { encodeFunctionData, parseAccount } from "viem/utils"
import { ERROR_MESSAGES } from "../../../account"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import {
  type ActionData,
  OWNABLE_VALIDATOR_ADDRESS,
  type PolicyData,
  SMART_SESSIONS_ADDRESS,
  type Session,
  encodeValidationData,
  getSpendingLimitsPolicy,
  getSudoPolicy,
  getUsageLimitPolicy,
  getValueLimitPolicy
} from "../../../constants"
import { SmartSessionAbi } from "../../../constants/abi/SmartSessionAbi"
import type { ModularSmartAccount } from "../../utils/Types"
import {
  abiToPoliciesInfo,
  applyDefaults,
  createActionConfig,
  createActionData,
  generateSalt,
  getPermissionId,
  toActionConfig
} from "../Helpers"
import type {
  CreateSessionDataParams,
  FullCreateSessionDataParams,
  PreparePermissionResponse,
  ResolvedActionPolicyInfo
} from "../Types"

export const ONE_YEAR_FROM_NOW_IN_SECONDS = Date.now() + 60 * 60 * 24 * 365

/**
 * Parameters for creating sessions in a modular smart account.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 */
export type PreparePermissionParameters<
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
}): Promise<PreparePermissionResponse | Error> => {
  const sessions: Session[] = []
  const permissionIds: Hex[] = []

  const resolvedPolicyInfo2ActionData = (
    actionPolicyInfo: ResolvedActionPolicyInfo
  ) => {
    const actionConfig = createActionConfig(
      actionPolicyInfo.rules ?? [],
      actionPolicyInfo.valueLimit
    )

    const policyData: PolicyData[] = []

    // create uni action policy here..
    const uniActionPolicyInfo = getUniversalActionPolicy(
      toActionConfig(actionConfig)
    )
    policyData.push(uniActionPolicyInfo)

    // create time frame policy here..
    const timeFramePolicyData = getTimeFramePolicy({
      validUntil: actionPolicyInfo.validUntil ?? ONE_YEAR_FROM_NOW_IN_SECONDS,
      validAfter: actionPolicyInfo.validAfter ?? 0
    })
    policyData.push(timeFramePolicyData)

    // create sudo policy here..
    if (actionPolicyInfo.sudo) {
      const sudoPolicy = getSudoPolicy()
      policyData.push(sudoPolicy)
    }

    // create value limit policy here..
    if (actionPolicyInfo.valueLimit) {
      const valueLimitPolicy = getValueLimitPolicy({
        limit: actionPolicyInfo.valueLimit
      })
      policyData.push(valueLimitPolicy)
    }

    // create usage limit policy here..
    if (actionPolicyInfo.usageLimit) {
      const usageLimitPolicy = getUsageLimitPolicy({
        limit: actionPolicyInfo.usageLimit
      })
      policyData.push(usageLimitPolicy)
    }

    // create token spending limit policy here..
    if (actionPolicyInfo.tokenLimits?.length) {
      const spendingLimitPolicy = getSpendingLimitsPolicy(
        actionPolicyInfo.tokenLimits
      )
      policyData.push(spendingLimitPolicy)
    }

    // Create ActionData
    const actionPolicy = createActionData(
      actionPolicyInfo.contractAddress,
      actionPolicyInfo.functionSelector,
      policyData
    )

    return actionPolicy
  }

  // Start populating the session for each param provided
  for (const sessionInfo of sessionRequestedInfo) {
    const actionPolicies: ActionData[] = []

    for (const actionPolicyInfo of sessionInfo.actionPoliciesInfo ?? []) {
      if (actionPolicyInfo.abi) {
        // Resolve the abi to multiple function selectors...
        const resolvedPolicyInfos = abiToPoliciesInfo(actionPolicyInfo)
        const actionPolicies_ = resolvedPolicyInfos.map(
          resolvedPolicyInfo2ActionData
        )
        actionPolicies.push(...actionPolicies_)
      } else {
        const actionPolicy = resolvedPolicyInfo2ActionData(actionPolicyInfo)
        actionPolicies.push(actionPolicy)
      }
    }

    const userOpTimeFramePolicyData = getTimeFramePolicy({
      validUntil: sessionInfo.sessionValidUntil ?? ONE_YEAR_FROM_NOW_IN_SECONDS,
      validAfter: sessionInfo.sessionValidAfter ?? 0
    })

    const session: Session = {
      chainId: BigInt(chainId),
      sessionValidator: OWNABLE_VALIDATOR_ADDRESS,
      sessionValidatorInitData: encodeValidationData({
        threshold: 1,
        owners: [sessionInfo.sessionKeyData]
      }),
      salt: sessionInfo.salt ?? generateSalt(),
      userOpPolicies: [userOpTimeFramePolicyData],
      actions: actionPolicies,
      erc7739Policies: {
        allowedERC7739Content: [],
        erc1271Policies: []
      }
      // permitERC4337Paymaster: true
    }

    const permissionId = await getPermissionId({
      client,
      session
    })
    // push permissionId to the array
    permissionIds.push(permissionId)

    // Push to sessions array
    sessions.push(session)
  }

  const preparePermissionData = encodeFunctionData({
    abi: SmartSessionAbi,
    functionName: "enableSessions",
    args: [sessions]
  })

  return {
    action: {
      target: SMART_SESSIONS_ADDRESS,
      value: BigInt(0),
      callData: preparePermissionData
    },
    permissionIds: permissionIds,
    sessions
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
 * import { preparePermission } from '@biconomy/sdk'
 *
 * const result = await preparePermission(nexusClient, {
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
export async function preparePermission<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters: PreparePermissionParameters<TModularSmartAccount>
): Promise<PreparePermissionResponse> {
  const {
    publicClient: publicClient_ = client.account?.client as PublicClient,
    account: account_ = client.account,
    sessionRequestedInfo
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as ModularSmartAccount
  if (!account || !account.address) {
    throw new Error("Account not found")
  }

  const chainId = publicClient_?.chain?.id

  if (!chainId) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  }

  const defaultedSessionRequestedInfo = sessionRequestedInfo.map(applyDefaults)

  const actionResponse = await getPermissionAction({
    chainId,
    client: publicClient_,
    sessionRequestedInfo: defaultedSessionRequestedInfo
  })

  if (actionResponse instanceof Error) {
    throw actionResponse
  }

  return actionResponse
}
