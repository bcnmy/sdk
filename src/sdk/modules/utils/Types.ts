import type { AbiFunction, Address, Chain, Hex } from "viem"
import { type EnableSessionData, SmartSessionMode } from "@rhinestone/module-sdk"
// import type { Signer, UnknownSigner } from "../../account/utils/toSigner"

// Review:
export type ModuleVersion = "1.0.0-beta" // | 'V1_0_1'

export type SignerData = {
  /** This is not the public as provided by viem, key but address for the given pvKey */
  pbKey: Hex
  /** Private key */
  pvKey: Hex
}

export type ChainInfo = number | Chain

export type CreateSessionDataResponse = {
  data: string
  sessionIDInfo: Array<string>
}

// Review: if needed
export type V3ModuleInfo = {
  module: Address
  data: Hex
  additionalContext: Hex
  type: ModuleType
  hook?: Address
}

export type Execution = {
  target: Address
  value: bigint
  callData: Hex
}

export enum SafeHookType {
  GLOBAL = 0,
  SIG = 1
}

export type ModuleType = "validator" | "executor" | "fallback" | "hook"

type ModuleTypeIds = {
  [index in ModuleType]: 1 | 2 | 3 | 4
}

export const moduleTypeIds: ModuleTypeIds = {
  validator: 1,
  executor: 2,
  fallback: 3,
  hook: 4
}

// TODO: add types related to smart sessions

export type SmartSessionModeType =
  (typeof SmartSessionMode)[keyof typeof SmartSessionMode]

export type ModuleSignatureMetadata = {
  mode?: SmartSessionModeType
  permissionId?: Hex
  enableSessionData?: EnableSessionData
}

// TODO: finalise & describe the types

export type CreateSessionDataParams = {
  sessionPublicKey?: Hex // Works in case of session validator address is K1 algorithm. for other validators made up sessionData is needed

  sessionValidatorAddress: Address // constant for a type of validator

  sessionValidatorType?: string // usually simple K1 validator. ECDSA session key

  sessionKeyData: Hex

  salt?: Hex

  // session validity means this will be applied as UseropPolicy through time frame policy
  sessionValidUntil?: number

  sessionValidAfter?: number

  // note: either I accept already cooked up policies.
  // note: policy is just it's address and initdata for that policy.
  // you may apply it as userOpPolicy or actionPolicy 
  // or I accept params and make policies accordingly and apply to the session
  // userOpPolicies?: PolicyData[]
  //actionPolicies?: PolicyData[]
  //erc7739Policies?: PolicyData[]

  actionPoliciesInfo: ActionPolicyData[]

  // useful for enable mode
  // Note: I could create a new type

  // which all chains we want to enable this particular session on
  chainIds?: bigint[]
} 

export type ActionPolicyData = {
  /** The address of the contract to be included in the policy */
contractAddress: Hex;

/** The specific function selector from the contract to be included in the policy */
functionSelector: string | AbiFunction;

validUntil: number

validAfter: number

rules: ParamRule[];

/** The maximum value that can be transferred in a single transaction */
valueLimit: bigint;
}

export type ParamRule = {
  condition: ParamCondition
  offset: number
  isLimited: boolean
  ref: Hex
  usage: LimitUsage
}

export type LimitUsage = {
  limit: bigint
  used: bigint
}

export enum ParamCondition {
  EQUAL,
  GREATER_THAN,
  LESS_THAN,
  GREATER_THAN_OR_EQUAL,
  LESS_THAN_OR_EQUAL,
  NOT_EQUAL,
}

