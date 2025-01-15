import {
  type Abi,
  type AbiFunction,
  type Address,
  type Hex,
  type PublicClient,
  getAddress,
  toBytes,
  toFunctionSelector,
  toHex
} from "viem"
import {
  type ActionData,
  OWNABLE_VALIDATOR_ADDRESS,
  type PolicyData,
  REGISTRY_ADDRESS,
  encodeValidationData
} from "../../constants"
import { ERC7484RegistryAbi } from "../../constants/abi"
import { parseReferenceValue } from "../utils/Helpers"
import type { AnyData } from "../utils/Types"
import type {
  ActionConfig,
  ActionPolicyInfo,
  CreateSessionDataParams,
  FullCreateSessionDataParams,
  ResolvedActionPolicyInfo,
  Rule
} from "./Types"
import { ONE_YEAR_FROM_NOW_IN_SECONDS } from "./decorators/preparePermission"

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
    sessionValidUntil:
      sessionInfo.sessionValidUntil ?? ONE_YEAR_FROM_NOW_IN_SECONDS,
    sessionValidAfter: sessionInfo.sessionValidAfter ?? 0,
    sessionValidator: sessionInfo.sessionValidator ?? OWNABLE_VALIDATOR_ADDRESS,
    sessionValidatorInitData:
      sessionInfo.sessionValidatorInitData ??
      encodeValidationData({
        threshold: 1,
        owners: [getAddress(sessionPublicKey)]
      })
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
export const toActionConfig = (config: ActionConfig) => {
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
          offset: rule.offsetIndex * 32,
          isLimited: rule.isLimited,
          ref: parsedRef,
          usage: rule.usage
        }
      })
    }
  }
}

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

/**
 * Converts an ABI to a list of ActionPolicyInfo objects.
 *
 * @param params - The parameters object
 * @param params.abi - The ABI to convert
 * @param params.actionPolicyInfo - The ActionPolicyInfo object to apply to each function in the ABI
 *
 * @example
 * const actionPoliciesInfo = abiToPoliciesInfo({
 *   abi: CounterAbi,
 *   actionPolicyInfo: {
 *     contractAddress: testAddresses.Counter,
 *     sudo: false,
 *     tokenLimits: [],
 *     usageLimit: 1000n,
 *     valueLimit: 1000n
 *   }
 * })
 * @returns An array of ActionPolicyInfo objects
 */

export type AbiToPoliciesInfoParams = Omit<
  ActionPolicyInfo,
  "functionSelector" | "rules"
> & { abi: Abi }

export const abiToPoliciesInfo = ({
  abi,
  ...actionPolicyInfo
}: AbiToPoliciesInfoParams): ResolvedActionPolicyInfo[] =>
  (abi ?? [])
    .filter((item): item is AbiFunction => item.type === "function")
    .map((func) => ({
      ...actionPolicyInfo,
      functionSelector: toFunctionSelector(func),
      rules: [] // Rules should not be available here because they should be custom per method, not used in a loop
    }))
