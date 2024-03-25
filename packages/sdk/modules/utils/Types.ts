import type { Address, Chain, Hex } from "viem"
import type { SimulationType } from "../../account/utils/Types"
import type { Holder, UnknownHolder } from "../../account/utils/toHolder"

export type ModuleVersion = "1.0.0-beta" // | 'V1_0_1'

export interface BaseValidationModuleConfig {
  /** entryPointAddress: address of the entry point */
  entryPointAddress?: Hex
}

export interface K1ValidationModuleConfig extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  signer: UnknownHolder
}

export interface K1ValidatorModuleConfigConstructorProps
  extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Signer: Converted from viemWallet or ethers signer to Holder */
  holder: Holder
}

export type SessionDataTuple = [
  bigint | number,
  bigint | number,
  Hex,
  Hex,
  string[],
  string
]

export type SessionParams = {
  /** ID of the session */
  sessionID?: string
  /** Session Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  sessionSigner: UnknownHolder
  /** The session validation module is a sub-module smart-contract which works with session key manager validation module. It validates the userop calldata against the defined session permissions (session key data) within the contract. */
  sessionValidationModule?: Hex
  /** Additional info if needed to be appended in signature */
  additionalSessionData?: string
}

export type StrictSessionParams = {
  sessionID: string
  sessionSigner: UnknownHolder
}

export type ModuleInfo = {
  // Could be a full object of below params and that way it can be an array too!
  // sessionParams?: SessionParams[] // where SessionParams is below four
  sessionID?: string
  /** Session Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  sessionHolder?: UnknownHolder
  /** The session validation module is a sub-module smart-contract which works with session key manager validation module. It validates the userop calldata against the defined session permissions (session key data) within the contract. */
  sessionValidationModule?: Hex
  /** Additional info if needed to be appended in signature */
  additionalSessionData?: string
  /** Batch session params */
  batchSessionParams?: SessionParams[]
}

export interface SendUserOpParams extends ModuleInfo {
  /** "validation_and_execution" is recommended during development for improved debugging & devEx, but will add some additional latency to calls. "validation" can be used in production ro remove this latency once flows have been tested. */
  simulationType?: SimulationType
}

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

export interface CreateSessionDataParams {
  /** window end for the session key */
  validUntil: number
  /** window start for the session key */
  validAfter: number
  /** Address of the session validation module */
  sessionValidationModule: Hex
  /** Public key of the session */
  sessionPublicKey: Hex
  /** The hex of the rules {@link Rule} that make up the policy */
  sessionKeyData: Hex
  /** we generate uuid based sessionId. but if you prefer to track it on your side and attach custom session identifier this can be passed */
  preferredSessionId?: string
}

export interface MultiChainValidationModuleConfig
  extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  signer: UnknownHolder
}
export interface MultiChainValidationModuleConfigConstructorProps
  extends BaseValidationModuleConfig {
  /** Address of the module */
  moduleAddress?: Hex
  /** Version of the module */
  version?: ModuleVersion
  /** Signer: viemWallet or ethers signer. Ingested when passed into smartAccount */
  holder: Holder
}

export interface BaseSessionKeyData {
  sessionKey: Hex
}

export interface ERC20SessionKeyData extends BaseSessionKeyData {
  /** ERC20 token address */
  token: Hex
  /** Recipient address */
  recipient: Hex
  /** ERC20 amount (Bigint) */
  maxAmount: bigint
}

export interface SessionValidationModuleConfig {
  /** Address of the module */
  moduleAddress: string
}

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
