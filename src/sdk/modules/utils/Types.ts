import type { Address, Chain, Hex } from "viem"
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

