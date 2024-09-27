import { type AbiFunction, type Address, encodePacked, type Hex, pad, type PublicClient, toBytes, toHex } from "viem";
import { type ActionConfig, type ParamRule } from "../../../utils/Types";
import { type ActionData, type PolicyData, type Session } from "@rhinestone/module-sdk";
import { parseReferenceValue } from "../../..";
import addresses from "../../../../__contracts/addresses"
import { SmartSessionAbi } from "../../../../__contracts/abi/SmartSessionAbi";

const TIMEFRAME_POLICY_ADDRESS = addresses.TimeframePolicy

export const generateSalt = (): Hex => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return `0x${Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')}` as Hex;
};

export const createActionConfig = (rules: ParamRule[], valueLimit: bigint): ActionConfig => {
    return {
        paramRules: {
            length: rules.length,
            rules: rules
        },
        valueLimitPerUse: valueLimit
    };
};

export const createActionData = (contractAddress: Address, functionSelector: string | AbiFunction, policies: PolicyData[]): ActionData => {
    return {
        actionTarget: contractAddress,
        actionTargetSelector: (typeof functionSelector === 'string' ? functionSelector : functionSelector.name) as Hex,
        actionPolicies: policies
    };
};

export const toActionConfig = (config: ActionConfig): ActionConfig => {
    // Ensure we always have 16 rules, filling with default values if necessary
    const filledRules = [...config.paramRules.rules];
  
    // Fill the rest with default ParamRule if the length is less than 16
    while (filledRules.length < 16) {
      filledRules.push({
        condition: 0,  // Default condition (EQUAL)
        offset: 0,  // Default offsetIndex
        isLimited: false,  // Default isLimited flag
        ref: "0x0000000000000000000000000000000000000000000000000000000000000000",  // Default bytes32 ref
        usage: {
          limit: BigInt(0),  // Default limit
          used: BigInt(0)    // Default used
        }
      });
    }
  
    return {
      valueLimitPerUse: BigInt(config.valueLimitPerUse),
      paramRules: {
        length: config.paramRules.length,
        rules: filledRules.map((rule) => {
          const parsedRef = parseReferenceValue(rule.ref);
          return {
            condition: rule.condition,
            offset: rule.offset * 32,  // Ensure correct offset calculation
            isLimited: rule.isLimited,
            ref: parsedRef,
            usage: rule.usage
          };
        })
      }
    };
  };

  export const toTimeRangePolicy = (validUntil: number, validAfter: number): PolicyData => {
    const validUntilBytes = pad(toBytes(BigInt(validUntil), { size: 16 }), { dir: 'right', size: 16 });
    const validAfterBytes = pad(toBytes(BigInt(validAfter), { size: 16 }), { dir: 'right', size: 16 });
    const packedData = encodePacked(['bytes16', 'bytes16'], [toHex(validUntilBytes), toHex(validAfterBytes)]);
    const timeFramePolicyData: PolicyData = {
        policy: TIMEFRAME_POLICY_ADDRESS,
        // initData for TimeframePolicy
        initData: packedData
    };
    return timeFramePolicyData
  }

  // Review: presently created local helper
  export const getPermissionId = async ({
    client,
    session,
  }: {
    client: PublicClient
    session: Session
  }) => {
    return (await client.readContract({
      address: addresses.SmartSession,
      abi: SmartSessionAbi,
      functionName: 'getPermissionId',
      args: [session],
    })) as Hex
  }

  export const isSessionEnabled = async ({
    client,
    accountAddress,
    permissionId,
  }: {
    client: PublicClient
    accountAddress: Address
    permissionId: Hex
  }) => {
    return (await client.readContract({
      address: addresses.SmartSession,
      abi: SmartSessionAbi,
      functionName: 'isSessionEnabled',
      args: [permissionId, accountAddress],
    })) as boolean
  }