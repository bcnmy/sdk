import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import {
  type GetSmartAccountParameter,
  type SmartAccount,
  sendUserOperation
} from "viem/account-abstraction"
import { encodeAbiParameters, encodeFunctionData, getAction, parseAccount } from "viem/utils"
import addresses from "../../../../__contracts/addresses"
import { AccountNotFoundError } from "../../../../account/utils/AccountNotFound"
import { type CreateSessionDataParams } from "../../../utils/Types"
import { type ActionData, type PolicyData, type Session, type Account, type Execution } from "@rhinestone/module-sdk"
import { createActionConfig, createActionData, generateSalt, getPermissionId, toActionConfig, toTimeRangePolicy } from "./Helper"
import { UniActionPolicyAbi } from "../../../../__contracts/abi"
import { SmartSessionAbi } from "../../../../__contracts/abi/SmartSessionAbi"
// Review: Execution type could either be used from our sdk or from module-sdk

const UNIVERSAL_POLICY_ADDRESS = addresses.UniActionPolicy
const SIMPLE_SESSION_VALIDATOR_ADDRESS = addresses.SimpleSessionValidator


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

    const sessions: Session[] = [];
    const permissionIds: Hex[] = [];

    // Start populating the session for each param provided
    for (const sessionInfo of sessionRequestedInfo) {
        const actionPolicies: ActionData[] = [];
        for (const actionPolicyInfo of sessionInfo.actionPoliciesInfo) {
            // TODO: make it easy to generate rules for particular contract and selectors.
            const actionConfig = createActionConfig(actionPolicyInfo.rules, actionPolicyInfo.valueLimit);

            // TODO: use util instead to create uni action policy here..
            // one may also pass baked up policyData.

            // create uni action policy here..
            const uniActionPolicyData: PolicyData = {
            policy: UNIVERSAL_POLICY_ADDRESS,
            // Build initData for UniversalActionPolicy
            initData: encodeAbiParameters(
                UniActionPolicyAbi,
                [toActionConfig(actionConfig)]
                )
            };
            // create time range policy here..
            const timeFramePolicyData: PolicyData = toTimeRangePolicy(actionPolicyInfo.validUntil, actionPolicyInfo.validAfter);

            // Create ActionData
            const actionPolicy = createActionData(
                actionPolicyInfo.contractAddress,
                actionPolicyInfo.functionSelector,
                [uniActionPolicyData, timeFramePolicyData]
            );

            actionPolicies.push(actionPolicy);
        }

        const userOpTimeFramePolicyData: PolicyData = toTimeRangePolicy(sessionInfo.sessionValidUntil ?? 0, sessionInfo.sessionValidAfter ?? 0);

        const session: Session = {
            sessionValidator: sessionInfo.sessionValidatorAddress ?? SIMPLE_SESSION_VALIDATOR_ADDRESS,
            sessionValidatorInitData: sessionInfo.sessionKeyData, // sessionValidatorInitData: abi.encodePacked(sessionSigner.addr),
            salt: sessionInfo.salt ?? generateSalt(),
            userOpPolicies: [userOpTimeFramePolicyData], //note: timeframe policy can also be applied to userOp, so it will have to be provided separately
            actions: actionPolicies,
            erc7739Policies: {
              allowedERC7739Content: [],
              erc1271Policies: []
            }
          };
    
          const permissionId = await getPermissionId({ client: client, session: session }) as Hex;
          // push permissionId to the array
          permissionIds.push(permissionId);
    
          // Push to sessions array
          sessions.push(session);
    }

    const enableSessionsData = encodeFunctionData({
      abi: SmartSessionAbi,
      functionName: "enableSessions",
      args: [sessions]
    });

    
    return {
      target: addresses.SmartSession,
      value: BigInt(0),
      callData: enableSessionsData,
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

