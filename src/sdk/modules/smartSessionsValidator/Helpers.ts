import type { ActionData, PolicyData, Session } from "@rhinestone/module-sdk"
import {
  type AbiFunction,
  type Address,
  type Hex,
  type PublicClient,
  encodeAbiParameters,
  encodePacked,
  pad,
  toBytes,
  toHex
} from "viem"
import {
  SIMPLE_SESSION_VALIDATOR_ADDRESS,
  SMART_SESSIONS_ADDRESS,
  TIMEFRAME_POLICY_ADDRESS,
  UNIVERSAL_ACTION_POLICY_ADDRESS
} from "../../constants"
import { UniActionPolicyAbi } from "../../constants/abi"
import { SmartSessionAbi } from "../../constants/abi/SmartSessionAbi"
import { parseReferenceValue } from "../utils/Helpers"
import type {
  ActionConfig,
  CreateSessionDataParams,
  FullCreateSessionDataParams,
  RawActionConfig,
  Rule,
  SessionData,
  SpendingLimitsParams
} from "./Types"

export const MAX_RULES = 16

/**
 * Generates a random salt as a hexadecimal string.
 *
 * @returns A 32-byte hexadecimal string prefixed with '0x'.
 */
export const generateSalt = (): Hex => {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  return `0x${Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")}` as Hex
}

/**
 * Creates an ActionConfig object from rules and a value limit.
 *
 * @param rules - An array of Rule objects.
 * @param valueLimit - The maximum value allowed for the action.
 * @returns An ActionConfig object.
 */
export const createActionConfig = (
  rules: Rule[],
  valueLimit = 0n
): ActionConfig => ({
  paramRules: {
    length: rules.length,
    rules: rules
  },
  valueLimitPerUse: valueLimit
})

/**
 * Applies default values to a CreateSessionDataParams object.
 *
 * @param sessionInfo - The CreateSessionDataParams object to apply defaults to.
 * @returns A FullCreateSessionDataParams object with default values applied.
 */
export const applyDefaults = (
  sessionInfo: CreateSessionDataParams
): FullCreateSessionDataParams => {
  const sessionKeyData =
    sessionInfo.sessionKeyData ?? toHex(toBytes(sessionInfo.sessionPublicKey))
  const sessionPublicKey = sessionInfo.sessionPublicKey ?? sessionKeyData
  return {
    ...sessionInfo,
    sessionKeyData,
    sessionPublicKey,
    sessionValidUntil: sessionInfo.sessionValidUntil ?? 0,
    sessionValidAfter: sessionInfo.sessionValidAfter ?? 0,
    sessionValidatorAddress:
      sessionInfo.sessionValidatorAddress ?? SIMPLE_SESSION_VALIDATOR_ADDRESS
  }
}

/**
 * Creates an ActionData object.
 *
 * @param contractAddress - The address of the contract.
 * @param functionSelector - The function selector or AbiFunction.
 * @param policies - An array of PolicyData objects.
 * @returns An ActionData object.
 */
export const createActionData = (
  contractAddress: Address,
  functionSelector: string | AbiFunction,
  policies: PolicyData[]
): ActionData => {
  return {
    actionTarget: contractAddress,
    actionTargetSelector: (typeof functionSelector === "string"
      ? functionSelector
      : functionSelector.name) as Hex,
    actionPolicies: policies
  }
}

/**
 * Converts an ActionConfig to a RawActionConfig.
 *
 * @param config - The ActionConfig to convert.
 * @returns A RawActionConfig object.
 */
export const toActionConfig = (config: ActionConfig): RawActionConfig => {
  // Ensure we always have 16 rules, filling with default values if necessary
  const filledRules = [...config.paramRules.rules]

  // Fill the rest with default ParamRule if the length is less than 16
  while (filledRules.length < MAX_RULES) {
    filledRules.push({
      condition: 0, // Default condition (EQUAL)
      offsetIndex: 0, // Default offset
      isLimited: false, // Default isLimited flag
      ref: "0x0000000000000000000000000000000000000000000000000000000000000000", // Default bytes32 ref
      usage: {
        limit: BigInt(0), // Default limit
        used: BigInt(0) // Default used
      }
    })
  }

  return {
    valueLimitPerUse: BigInt(config.valueLimitPerUse),
    paramRules: {
      length: config.paramRules.length,
      rules: filledRules.map((rule) => {
        const parsedRef = parseReferenceValue(rule.ref)
        return {
          condition: rule.condition,
          offset: BigInt(rule.offsetIndex) * BigInt(32),
          isLimited: rule.isLimited,
          ref: parsedRef,
          usage: rule.usage
        }
      })
    }
  }
}

/**
 * Gets the permission ID for a given session.
 *
 * @param client - The PublicClient to use for the contract call.
 * @param session - The Session object.
 * @returns A promise that resolves to the permission ID as a Hex string.
 */
export const getPermissionId = async ({
  client,
  session
}: {
  client: PublicClient
  session: Session
}) => {
  return (await client.readContract({
    address: SMART_SESSIONS_ADDRESS,
    abi: SmartSessionAbi,
    functionName: "getPermissionId",
    args: [session]
  })) as Hex
}

export const isPermissionEnabled = async ({
  client,
  accountAddress,
  permissionId
}: {
  client: PublicClient
  accountAddress: Address
  permissionId: Hex
}) =>
  client.readContract({
    address: SMART_SESSIONS_ADDRESS,
    abi: SmartSessionAbi,
    functionName: "isPermissionEnabled",
    args: [permissionId, accountAddress]
  })

/**
 * Converts an ActionConfig to a UniversalActionPolicy.
 *
 * @param actionConfig - The ActionConfig to convert.
 * @returns A PolicyData object representing the UniversalActionPolicy.
 */
export const toUniversalActionPolicy = (
  actionConfig: ActionConfig
): PolicyData => ({
  policy: UNIVERSAL_ACTION_POLICY_ADDRESS,
  initData: encodeAbiParameters(UniActionPolicyAbi, [
    toActionConfig(actionConfig)
  ])
})

/**
 * Creates a TimeRangePolicy.
 *
 * @param validUntil - The timestamp until which the policy is valid.
 * @param validAfter - The timestamp after which the policy is valid.
 * @returns A PolicyData object representing the TimeRangePolicy.
 */
export const toTimeRangePolicy = (
  validUntil: number,
  validAfter: number
): PolicyData => {
  const validUntilBytes = pad(toBytes(BigInt(validUntil), { size: 16 }), {
    dir: "right",
    size: 16
  })
  const validAfterBytes = pad(toBytes(BigInt(validAfter), { size: 16 }), {
    dir: "right",
    size: 16
  })
  const packedData = encodePacked(
    ["bytes16", "bytes16"],
    [toHex(validUntilBytes), toHex(validAfterBytes)]
  )
  const timeFramePolicyData: PolicyData = {
    policy: TIMEFRAME_POLICY_ADDRESS,
    // initData for TimeframePolicy
    initData: packedData
  }
  return timeFramePolicyData
}

/**
 * A PolicyData object representing a sudo policy.
 */
export const sudoPolicy: PolicyData = {
  policy: "0x529Ad04F4D83aAb25144a90267D4a1443B84f5A6",
  initData: "0x"
}

/**
 * Converts SpendingLimitsParams to a SpendingLimitsPolicy.
 *
 * @param params - An array of SpendingLimitsParams.
 * @returns A PolicyData object representing the SpendingLimitsPolicy.
 */
export const toSpendingLimitsPolicy = (
  params: SpendingLimitsParams
): PolicyData => {
  return {
    policy: "0x8e58f4945e6ba2a11b184a9c20b6c765a0891b95",
    initData: encodeAbiParameters(
      [{ type: "address[]" }, { type: "uint256[]" }],
      [params.map(({ token }) => token), params.map(({ limit }) => limit)]
    )
  }
}

/**
 * An object containing policy conversion functions.
 */
export const policies = {
  to: {
    universalAction: toUniversalActionPolicy,
    spendingLimits: toSpendingLimitsPolicy
  },
  sudo: sudoPolicy
} as const

/**
 * Zips SessionData into a compact string representation.
 *
 * @param sessionData - The SessionData object to be zipped.
 * @returns A string representing the zipped SessionData.
 */
export function zipSessionData(sessionData: SessionData): string {
  return JSON.stringify(sessionData)
}

/**
 * Unzips a string representation back into a SessionData object.
 *
 * @param zippedData - The string representing the zipped SessionData.
 * @returns The unzipped SessionData object.
 */
export function unzipSessionData(zippedData: string): SessionData {
  return JSON.parse(zippedData) as SessionData
}

// Todo
// 1. find trusted attesters. why not just here instead of part of read decorators?
// 2. get trusteAttesters calldata. or returning the whole "Action"/Execution 


export default policies
