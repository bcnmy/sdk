import {
  getSpendingLimitsPolicy,
  getTimeFramePolicy,
  getUniversalActionPolicy,
  getUsageLimitPolicy,
  getValueLimitPolicy
} from "@rhinestone/module-sdk"
import { type Hex, toBytes, toHex } from "viem"
import { isTesting } from "../account"
import { ParamCondition } from "../modules/smartSessionsValidator/Types"

export * from "./abi"

export const SIMPLE_SESSION_VALIDATOR_ADDRESS: Hex =
  "0x41f143f4B5f19AfCd2602F6ADE18E75e9b5E37d3"
export const ENTRY_POINT_ADDRESS: Hex =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
export const ENTRYPOINT_SIMULATIONS_ADDRESS: Hex =
  "0x74Cb5e4eE81b86e70f9045036a1C5477de69eE87"
export const TIMEFRAME_POLICY_ADDRESS: Hex =
  "0x0B7BB9bD65858593D97f12001FaDa94828307805"
export const NEXUS_BOOTSTRAP_ADDRESS: Hex =
  "0x00000008c901d8871b6F6942De0B5D9cCf3873d3"

export const TEST_ADDRESS_NEXUS_IMPLEMENTATION_ADDRESS: Hex =
  "0xDe3880ed9dBB5faECaB5F7d5DEC2C5815272fD47"
export const TEST_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS: Hex =
  "0x10c5d8DC02d7F360eC41b8F5AFFdE3e0BD0a2B6E"
export const TEST_ADDRESS_K1_VALIDATOR_ADDRESS: Hex =
  "0xCfa6175DDC2eF918e527b2972D9AB8B149f151b7"

export const MAINNET_ADDRESS_NEXUS_IMPLEMENTATION_ADDRESS: Hex =
  "0x000000039dfcAd030719B07296710F045F0558f7"
export const MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS: Hex =
  "0x00000bb19a3579F4D779215dEf97AFbd0e30DB55"
export const MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS: Hex =
  "0x00000004171351c442B202678c48D8AB5B321E8f"

export const nexusImplementationAddress: Hex = isTesting()
  ? TEST_ADDRESS_NEXUS_IMPLEMENTATION_ADDRESS
  : MAINNET_ADDRESS_NEXUS_IMPLEMENTATION_ADDRESS
export const k1ValidatorFactoryAddress: Hex = isTesting()
  ? TEST_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
  : MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
export const k1ValidatorAddress: Hex = isTesting()
  ? TEST_ADDRESS_K1_VALIDATOR_ADDRESS
  : MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS

// Rhinestone constants
export {
  SMART_SESSIONS_ADDRESS,
  OWNABLE_VALIDATOR_ADDRESS,
  OWNABLE_EXECUTOR_ADDRESS,
  MOCK_ATTESTER_ADDRESS,
  RHINESTONE_ATTESTER_ADDRESS,
  REGISTRY_ADDRESS
} from "@rhinestone/module-sdk"

// Rhinestone doesn't export the universal action policy address, so we need to get it from the policies
export const UNIVERSAL_ACTION_POLICY_ADDRESS: Hex = getUniversalActionPolicy({
  valueLimitPerUse: 0n,
  paramRules: {
    length: 16,
    rules: new Array(16).fill({
      condition: ParamCondition.EQUAL,
      isLimited: false,
      offset: 0,
      ref: toHex(toBytes("0x", { size: 32 })),
      usage: { limit: BigInt(0), used: BigInt(0) }
    })
  }
}).address

export const TIME_FRAME_POLICY_ADDRESS: Hex = getTimeFramePolicy({
  validUntil: 0,
  validAfter: 0
}).address

export const VALUE_LIMIT_POLICY_ADDRESS: Hex = getValueLimitPolicy({
  limit: 0n
}).address

export const USAGE_LIMIT_POLICY_ADDRESS: Hex = getUsageLimitPolicy({
  limit: 0n
}).address

export const SPENDING_LIMITS_POLICY_ADDRESS: Hex = getSpendingLimitsPolicy([
  {
    token: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    limit: 0n
  }
]).address
