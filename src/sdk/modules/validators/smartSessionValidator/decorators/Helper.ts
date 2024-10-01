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
import { parseReferenceValue } from "../../.."
import { SmartSessionAbi } from "../../../../__contracts/abi/SmartSessionAbi"
import addresses from "../../../../__contracts/addresses"
import type { ActionConfig, Policy, RawActionConfig, Rule, SpendingLimitsParams } from "../../../utils/Types"
import { UniActionPolicyAbi } from "../../../../__contracts/abi"

const TIMEFRAME_POLICY_ADDRESS = addresses.TimeframePolicy

export const MAX_RULES = 16

export const generateSalt = (): Hex => {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  return `0x${Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")}` as Hex
}

export const createActionConfig = (
  rules: Rule[],
  valueLimit: bigint
): ActionConfig => {
  return {
    paramRules: {
      length: rules.length,
      rules: rules
    },
    valueLimitPerUse: valueLimit
  }
}

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

// Review: presently created local helper
export const getPermissionId = async ({
  client,
  session
}: {
  client: PublicClient
  session: Session
}) => {
  return (await client.readContract({
    address: addresses.SmartSession,
    abi: SmartSessionAbi,
    functionName: "getPermissionId",
    args: [session]
  })) as Hex
}

export const isSessionEnabled = async ({
  client,
  accountAddress,
  permissionId
}: {
  client: PublicClient
  accountAddress: Address
  permissionId: Hex
}) => {
  return (await client.readContract({
    address: addresses.SmartSession,
    abi: SmartSessionAbi,
    functionName: "isSessionEnabled",
    args: [permissionId, accountAddress]
  })) as boolean
}

export const toUniversalActionPolicy = (
  actionConfig: ActionConfig
): Policy => ({
  address: "0x28120dC008C36d95DE5fa0603526f219c1Ba80f6",
  initData: encodeAbiParameters(UniActionPolicyAbi, [
    toActionConfig(actionConfig)
  ]),
  deInitData: "0x"
})

export const sudoPolicy: Policy = {
  address: "0x",
  initData: "0x",
  deInitData: "0x"
}

export const toSpendingLimitsPolicy = (params: SpendingLimitsParams): Policy => {
  return {
    address: "0xDe9688b24c00699Ad51961ef90Ce5a9a8C49982B",
    initData: encodeAbiParameters(
      [{ type: "address[]" }, { type: "uint256[]" }],
      [params.map(({ token }) => token), params.map(({ limit }) => limit)]
    ),
    deInitData: "0x"
  }
}

export const policies = {
  to: {
    universalAction: toUniversalActionPolicy,
    spendingLimits: toSpendingLimitsPolicy
  },
  sudo: sudoPolicy
} as const

export default policies
