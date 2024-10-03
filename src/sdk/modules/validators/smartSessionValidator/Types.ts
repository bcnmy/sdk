import type { AbiFunction, Address, Hex } from "viem"
import type { Execution } from "../../utils/Types"
import { type EnableSessionData, SmartSessionMode } from "@rhinestone/module-sdk"
import { type AnyReferenceValue } from "../../utils/Helper"

export type CreateSessionsActionReturnParams = {
  permissionIds: Hex[]
  action: Execution
}

export type CreateSessionsResponse = {
  userOpHash: Hex
  permissionIds: Hex[]
}

// Types related to smart sessions
export type SmartSessionModeType =
  (typeof SmartSessionMode)[keyof typeof SmartSessionMode]

export type ModuleSignatureMetadata = {
  mode?: SmartSessionModeType
  permissionId?: Hex
  enableSessionData?: EnableSessionData
}

// TODO: finalise & describe the types
// Review: Should we move smart session specific types to smartSessionValidator module?

export type CreateSessionDataParams = {
  sessionPublicKey?: Hex // Works in case of session validator address is K1 algorithm. for other validators made up sessionData is needed

  sessionValidatorAddress: Address // constant for a type of validator

  sessionValidatorType?: string // usually simple K1 validator. ECDSA session key

  sessionKeyData: Hex

  salt?: Hex

  // session validity means this will be applied as UseropPolicy through time frame policy
  sessionValidUntil?: number

  sessionValidAfter?: number

  actionPoliciesInfo: ActionPolicyData[]

  // useful for enable mode
  // Note: could create a new type for enable mode.
  // which all chains we want to enable this particular session on
  chainIds?: bigint[]
}

export type ActionPolicyData = {
  /** The address of the contract to be included in the policy */
  contractAddress: Hex

  /** The specific function selector from the contract to be included in the policy */
  functionSelector: string | AbiFunction

  validUntil: number

  validAfter: number

  rules: Rule[]

  /** The maximum value that can be transferred in a single transaction */
  valueLimit: bigint
}

export enum ParamCondition {
  EQUAL = 0,
  GREATER_THAN = 1,
  LESS_THAN = 2,
  GREATER_THAN_OR_EQUAL = 3,
  LESS_THAN_OR_EQUAL = 4,
  NOT_EQUAL = 5
}

// rule object to be passed by chad devs
export type Rule = {
  /**
   * EQUAL = 0,
   * GREATER_THAN = 1,
   * LESS_THAN = 2,
   * GREATER_THAN_OR_EQUAL = 3,
   * LESS_THAN_OR_EQUAL = 4,
   * NOT_EQUAL = 5
   */
  condition: ParamCondition
  /**
   * The offset in the calldata where the value to be checked is located.
   * The offset is in multiples of 32 bytes. (Note: not the offsetIndex)
   * The offsetIndex is generally the index of the arg in the method that you wish to target.
   * The exception is when the arg is in an array
   * In this case, the offsetIndex needs to be figured out using its position in the array
   * (See the 'use-of-dynamic-types' example below for how to figure out the offsetIndex for an array)
   *
   * https://docs.soliditylang.org/en/develop/abi-spec.html#use-of-dynamic-types
   *
   * */
  offsetIndex: number
  /**
   * If the rule is limited, the usage object will contain the limit and the used values.
   */
  isLimited: boolean
  /**
   * The reference value to compare against. You can pass in the raw hex value or a human-friendly value.
   * Use the raw hex value if you are sure of the value you are passing in.
   */
  ref: AnyReferenceValue
  /**
   * The usage object will contain the limit and the used values, and is only required if the isLimited property is true.
   */
  usage: LimitUsage
}

export type RawParamRule = {
  condition: ParamCondition
  offset: bigint
  isLimited: boolean
  ref: Hex
  usage: LimitUsage
}

export type RawParamRules = {
  length: number
  rules: RawParamRule[]
}

export type LimitUsage = {
  limit: bigint
  used: bigint
}

export type ActionConfig = {
  valueLimitPerUse: bigint
  paramRules: {
    length: number
    rules: Rule[]
  }
}

export type RawActionConfig = {
  valueLimitPerUse: bigint
  paramRules: RawParamRules
}

export type SpendingLimitsParams = {
  token: Address
  limit: bigint
}[]

