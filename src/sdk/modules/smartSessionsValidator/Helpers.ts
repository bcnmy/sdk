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
  REGISTRY_ADDRESS,
  SIMPLE_SESSION_VALIDATOR_ADDRESS,
  SMART_SESSIONS_ADDRESS,
  TIMEFRAME_POLICY_ADDRESS,
  UNIVERSAL_ACTION_POLICY_ADDRESS
} from "../../constants"
import { ERC7484RegistryAbi, UniActionPolicyAbi } from "../../constants/abi"
import { SmartSessionAbi } from "../../constants/abi/SmartSessionAbi"
import { parseReferenceValue } from "../utils/Helpers"
import type { AnyData } from "../utils/Types"
import type {
  ActionConfig,
  CreateSessionDataParams,
  FullCreateSessionDataParams,
  RawActionConfig,
  Rule,
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
 * Stringifies an object, explicitly tagging BigInt values.
 *
 * @param obj - The object to be stringified.
 * @returns A string representing the stringified object with tagged BigInts.
 */
export function stringify(obj: Record<string, AnyData>): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === "bigint"
      ? { __type: "bigint", value: value.toString() }
      : value
  )
}

/**
 * Parses a string representation back into an object, correctly handling tagged BigInt values.
 *
 * @param data - The string representing the stringified object.
 * @returns The parsed object with BigInt values restored.
 */
export function parse(data: string): Record<string, AnyData> {
  return JSON.parse(data, (_, value) => {
    if (value && typeof value === "object" && value.__type === "bigint") {
      return BigInt(value.value)
    }
    return value
  })
}

// Todo
// 1. find trusted attesters. why not just here instead of part of read decorators?
// 2. get trusteAttesters calldata. or returning the whole "Action"/Execution

/**
 * Retrieves the list of trusted attesters for a given account from the registry.
 *
 * This function queries the registry contract to find all attesters that are trusted
 * by the specified account.
 *
 * @param params - The parameters object
 * @param params.account - The account to check trusted attesters for
 * @param params.client - The public client used to interact with the blockchain
 * @returns A promise that resolves to an array of addresses representing the trusted attesters
 * @throws Will log error and return empty array if registry query fails
 */

export const getTrustedAttesters = async ({
  accountAddress,
  client
}: {
  accountAddress: Address
  client: PublicClient
}): Promise<Address[]> => {
  try {
    const attesters = (await client.readContract({
      address: REGISTRY_ADDRESS,
      abi: ERC7484RegistryAbi,
      functionName: "findTrustedAttesters",
      args: [accountAddress]
    })) as Address[]

    return attesters
  } catch (err) {
    console.error(err)
    return []
  }
}

export default policies
