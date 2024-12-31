import type { Abi, AbiFunction, Address, Hex, OneOf } from "viem"
import type {
  EnableSessionData,
  Session,
  SmartSessionMode
} from "../../constants"
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

  /** Description of the session. Useful for keeping humancontext about the session. */
  description?: string
}

export type PreparePermissionResponse = {
  /** Array of permission IDs for the created sessions. */
  permissionIds: Hex[]
  /** The execution object for the action. */
  action: Execution
  /** The sessions that were created. */
  sessions: Session[]
}

/**
 * Represents the response for creating sessions.
 */
export type GrantPermissionInAdvanceResponse = {
  /** The hash of the user operation. */
  userOpHash: Hex
} & PreparePermissionResponse

/**
 * Represents the possible modes for a smart session.
 */
export type SmartSessionModeType =
  (typeof SmartSessionMode)[keyof typeof SmartSessionMode]

/**
 * Represents the data structure for using a session module.
 */
export type UsePermissionModuleData = {
  /** The mode of the smart session. */
  mode?: SmartSessionModeType
  /** Data for enabling the session. */
  enableSessionData?: EnableSessionData
  /** The index of the permission ID to use for the session. Defaults to 0. */
  permissionIdIndex?: number
} & PreparePermissionResponse

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
  sessionValidator?: Address
  /** Data for the session validator. */
  sessionValidatorInitData?: Hex
  /** Optional salt for the session. */
  salt?: Hex
  /** Timestamp until which the session is valid. */
  sessionValidUntil?: number
  /** Timestamp after which the session becomes valid. */
  sessionValidAfter?: number
  /** Chain IDs where the session should be enabled. Useful for enable mode. */
  chainIds?: bigint[]
  /** Array of action policy data for the session. */
  actionPoliciesInfo: ActionPolicyInfo[]
}

export type FullCreateSessionDataParams = {
  /** Public key for the session. Required for K1 algorithm validators. */
  sessionPublicKey: Hex
  /** Address of the session validator. */
  sessionValidator?: Address
  /** Data for the session validator. */
  sessionValidatorInitData?: Hex
  /** Data for the session key. */
  sessionKeyData: Hex
  /** Optional salt for the session. */
  salt?: Hex
  /** Timestamp until which the session is valid. */
  sessionValidUntil: number
  /** Timestamp after which the session becomes valid. */
  sessionValidAfter: number
  /** Chain IDs where the session should be enabled. Useful for enable mode. */
  chainIds?: bigint[]
  /** Array of action policy data for the session. */
  actionPoliciesInfo: ActionPolicyInfo[]
}

export type SpendingLimitPolicyData = {
  /** The address of the token to be included in the policy */
  token: Address
  /** The limit for the token */
  limit: bigint
}

export type SudoPolicyData = {
  /** The address of the contract to be included in the policy */
  contractAddress: Hex
  /** The specific function selector from the contract to be included in the policy */
  functionSelector: string | AbiFunction
}

/**
 * Represents the data structure for an action policy.
 *
 * Get the universal action policy to use when creating a new session.
 * The universal action policy can be used to ensure that only actions where the calldata has certain parameters can be used.
 * For example, it could restrict swaps on Uniswap to be only under X amount of input token.
 */
export type ActionPolicyInfo = {
  /** The address of the contract to be included in the policy */
  contractAddress: Hex
  /** The timeframe policy can be used to restrict a session to only be able to be used within a certain timeframe */
  validUntil?: number
  /** Timestamp after which the policy becomes valid */
  validAfter?: number
  /** The value limit policy can be used to enforce that only a certain amount of native value can be spent. For ERC-20 limits, use the spending limit policy */
  valueLimit?: bigint
  /** The spending limits policy can be used to ensure that only a certain amount of ERC-20 tokens can be spent. For native value spends, use the value limit policy */
  tokenLimits?: SpendingLimitPolicyData[]
  /** The value limit policy can be used to enforce that only a certain amount of native value can be spent. For ERC-20 limits, use the spending limit policy. */
  usageLimit?: bigint
  /** The sudo policy is an action policy that will allow any action for the specified target and selector. */
  sudo?: boolean
} & OneOf<
  | {
      /** The specific function selector from the contract to be included in the policy */
      functionSelector: string | AbiFunction
      /** Array of rules for the policy */
      rules?: Rule[]
    }
  | {
      /** The ABI of the contract to be included in the policy */
      abi: Abi
    }
>

export type ResolvedActionPolicyInfo = ActionPolicyInfo & {
  functionSelector: string | AbiFunction
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
  offset: number
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
