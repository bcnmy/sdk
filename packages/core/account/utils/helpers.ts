import {
  type Address,
  type Hex,
  encodeAbiParameters,
  keccak256,
  parseAbiParameters
} from "viem"
import {
  DEFAULT_ENTRYPOINT_ADDRESS,
  type UserOperationStruct
} from "../../common/index.js"
import { type BiconomySmartAccountConfig } from "./types.js"

export const validateConfig = (config: BiconomySmartAccountConfig): void => {
  if (!config) {
    throw new Error("Config is missing")
  }
  // validate config and throw meaningful errors if something is missing
}

export const getUserOperationHash = (
  userOp: UserOperationStruct,
  chainId: number,
  entryPointAddress?: Address
): Hex => {
  const userOpHash = keccak256(packUserOp(userOp, true) as Hex)
  const enc = encodeAbiParameters(
    parseAbiParameters("bytes32, address, uint256"),
    [
      userOpHash,
      entryPointAddress ? entryPointAddress : DEFAULT_ENTRYPOINT_ADDRESS,
      BigInt(chainId)
    ]
  )
  return keccak256(enc)
}

export const packUserOp = (
  op: UserOperationStruct,
  forSignature = true
): string => {
  if (!op.initCode || !op.callData || !op.paymasterAndData)
    throw new Error("Missing userOp properties")
  if (forSignature) {
    return encodeAbiParameters(
      parseAbiParameters(
        "address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32"
      ),
      [
        op.sender as Hex,
        op.nonce,
        keccak256(op.initCode as Hex),
        keccak256(op.callData as Hex),
        op.callGasLimit,
        op.verificationGasLimit,
        op.preVerificationGas,
        op.maxFeePerGas,
        op.maxPriorityFeePerGas,
        keccak256(op.paymasterAndData as Hex)
      ]
    )
  } else {
    // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
    return encodeAbiParameters(
      parseAbiParameters(
        "address, uint256, bytes, bytes, uint256, uint256, uint256, uint256, uint256, bytes, bytes"
      ),
      [
        op.sender as Hex,
        op.nonce,
        op.initCode as Hex,
        op.callData as Hex,
        op.callGasLimit,
        op.verificationGasLimit,
        op.preVerificationGas,
        op.maxFeePerGas,
        op.maxPriorityFeePerGas,
        op.paymasterAndData as Hex,
        op.signature as Hex
      ]
    )
  }
}
