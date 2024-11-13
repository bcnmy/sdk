import type {
  EnableSessionData,
  SmartSessionMode
} from "@rhinestone/module-sdk"
import type { AbiFunction, Address, Hex, OneOf } from "viem"
import type { KeyGenData } from "../../clients/decorators/dan/decorators/keyGen"
import type { AnyReferenceValue } from "../utils/Helpers"
import type { Execution } from "../utils/Types"

/**
 * Represents the data structure for a smart session.
 * Smart sessions allow for delegated and controlled access to a user's account.
 *
 * @property granter - The address of the account granting the session permissions.
 * @property sessionPublicKey - The public key used to verify session signatures.
 * @property moduleData - Module-specific data for the session.
 * @property sessionPrivateKey - Optional. The private key for signing session transactions.
 */
export type SessionData = {
  /** Hex-encoded address of the account granting the session. */
  granter: Hex

  /** Hex-encoded public key for the session. Used for signature verification. */
  sessionPublicKey: Hex

  /** Module-specific data containing session configuration and permissions. */
  moduleData: UsePermissionModuleData
}

export type GrantPermissionActionReturnParams = {
  /** Array of permission IDs for the created sessions. */
  permissionIds: Hex[]
  /** The execution object for the action. */
  action: Execution
}

/**
 * Represents the response for creating sessions.
 */
export type GrantPermissionResponse = {
  /** The hash of the user operation. */
  userOpHash: Hex
  /** Array of permission IDs for the created sessions. */
  permissionIds: Hex[]
}

/**
 * Represents the possible modes for a smart session.
 */
export type SmartSessionModeType =
  (typeof SmartSessionMode)[keyof typeof SmartSessionMode]

/**
 * Represents the data structure for using a session module.
 */
export type UsePermissionModuleData = {
  /** The permission ID for the session. */
  permissionIds: Hex[]
  /** The mode of the smart session. */
  mode?: SmartSessionModeType
  /** Data for enabling the session. */
  enableSessionData?: EnableSessionData
  /** Key generation data for the session. */
  keyGenData?: KeyGenData
  /** The index of the permission ID to use for the session. Defaults to 0. */
  permissionIdIndex?: number
}

type OptionalSessionKeyData = OneOf<
  | {
      /** Public key for the session. Required for K1 algorithm validators. */
      sessionPublicKey: Hex
    }
  | {
      /** Data for the session key. */
      sessionKeyData: Hex
    }
>

/**
 * Parameters for creating a session.
 */
export type CreateSessionDataParams = OptionalSessionKeyData & {
  /** Public key for the session. Required for K1 algorithm validators. */
  sessionPublicKey?: Hex
  /** Address of the session validator. */
  sessionValidatorAddress?: Address
  /** Type of the session validator. Usually "simple K1 validator". */
  sessionValidatorType?: string
  /** Optional salt for the session. */
  salt?: Hex
  /** Timestamp until which the session is valid. */
  sessionValidUntil?: number
  /** Timestamp after which the session becomes valid. */
  sessionValidAfter?: number
  /** Array of action policy data for the session. */
  actionPoliciesInfo: ActionPolicyData[]
  /** Chain IDs where the session should be enabled. Useful for enable mode. */
  chainIds?: bigint[]
}

export type FullCreateSessionDataParams = {
  /** Public key for the session. Required for K1 algorithm validators. */
  sessionPublicKey: Hex
  /** Address of the session validator. */
  sessionValidatorAddress: Address
  /** Type of the session validator. Usually "simple K1 validator". */
  sessionValidatorType?: string
  /** Data for the session key. */
  sessionKeyData: Hex
  /** Optional salt for the session. */
  salt?: Hex
  /** Timestamp until which the session is valid. */
  sessionValidUntil: number
  /** Timestamp after which the session becomes valid. */
  sessionValidAfter: number
  /** Array of action policy data for the session. */
  actionPoliciesInfo: ActionPolicyData[]
  /** Chain IDs where the session should be enabled. Useful for enable mode. */
  chainIds?: bigint[]
}

/**
 * Represents the data structure for an action policy.
 */
export type ActionPolicyData = {
  /** The address of the contract to be included in the policy */
  contractAddress: Hex
  /** The specific function selector from the contract to be included in the policy */
  functionSelector: string | AbiFunction
  /** Timestamp until which the policy is valid */
  validUntil?: number
  /** Timestamp after which the policy becomes valid */
  validAfter?: number
  /** Array of rules for the policy */
  rules?: Rule[]
  /** The maximum value that can be transferred in a single transaction */
  valueLimit?: bigint
}

/**
 * Enum representing different parameter conditions for rules.
 */
export enum ParamCondition {
  EQUAL = 0,
  GREATER_THAN = 1,
  LESS_THAN = 2,
  GREATER_THAN_OR_EQUAL = 3,
  LESS_THAN_OR_EQUAL = 4,
  NOT_EQUAL = 5
}

/**
 * Represents a rule for action policies.
 */
export type Rule = {
  /** The condition to apply to the parameter */
  condition: ParamCondition
  /** The offset index in the calldata where the value to be checked is located */
  offsetIndex: number
  /** Indicates if the rule has a usage limit */
  isLimited: boolean
  /** The reference value to compare against */
  ref: AnyReferenceValue
  /** The usage object containing limit and used values (required if isLimited is true) */
  usage: LimitUsage
}

/**
 * Represents a raw parameter rule.
 */
export type RawParamRule = {
  condition: ParamCondition
  offset: bigint
  isLimited: boolean
  ref: Hex
  usage: LimitUsage
}

/**
 * Represents a set of raw parameter rules.
 */
export type RawParamRules = {
  length: number
  rules: RawParamRule[]
}

/**
 * Represents the usage limit for a rule.
 */
export type LimitUsage = {
  limit: bigint
  used: bigint
}

/**
 * Represents the configuration for an action.
 */
export type ActionConfig = {
  valueLimitPerUse: bigint
  paramRules: {
    length: number
    rules: Rule[]
  }
}

/**
 * Represents the raw configuration for an action.
 */
export type RawActionConfig = {
  valueLimitPerUse: bigint
  paramRules: RawParamRules
}

/**
 * Represents the parameters for spending limits.
 */
export type SpendingLimitsParams = {
  token: Address
  limit: bigint
}[]
