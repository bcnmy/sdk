import type { Address, Hash, Hex } from "viem"
import type { PartialBy } from "viem/chains"
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from "../../account/utils/types"

export type UserOperationWithBigIntAsHex = {
  sender: Address
  nonce: Hex
  factory: Address
  factoryData: Hex
  callData: Hex
  callGasLimit: Hex
  verificationGasLimit: Hex
  preVerificationGas: Hex
  maxFeePerGas: Hex
  maxPriorityFeePerGas: Hex
  paymaster: Address
  paymasterVerificationGasLimit: Hex
  paymasterPostOpGasLimit: Hex
  paymasterData: Hex
  signature: Hex
  initCode?: never
  paymasterAndData?: never
}

export type BundlerRpcSchema<entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE> = [
  {
    Method: "eth_sendUserOperation"
    Parameters: [
      userOperation: UserOperationWithBigIntAsHex,
      entryPoint: entryPoint
    ]
    ReturnType: Hash
  },
  {
    Method: "eth_estimateUserOperationGas"
    Parameters: [
      userOperation: PartialBy<
        UserOperationWithBigIntAsHex,
        | "callGasLimit"
        | "preVerificationGas"
        | "verificationGasLimit"
        | "paymasterVerificationGasLimit"
        | "paymasterPostOpGasLimit"
      >,
      entryPoint: entryPoint,
      stateOverrides?: StateOverrides
    ]
    ReturnType: {
      preVerificationGas: Hex
      verificationGasLimit: Hex
      callGasLimit?: Hex | null
      paymasterVerificationGasLimit?: Hex | null
      paymasterPostOpGasLimit?: Hex | null
    }
  },
  {
    Method: "eth_supportedEntryPoints"
    Parameters: []
    ReturnType: Address[]
  },
  {
    Method: "eth_chainId"
    Parameters: []
    ReturnType: Hex
  },
  {
    Method: "eth_getUserOperationByHash"
    Parameters: [hash: Hash]
    ReturnType: {
      userOperation: UserOperationWithBigIntAsHex
      entryPoint: entryPoint
      transactionHash: Hash
      blockHash: Hash
      blockNumber: Hex
    }
  },
  {
    Method: "eth_getUserOperationReceipt"
    Parameters: [hash: Hash]
    ReturnType: UserOperationReceiptWithBigIntAsHex
  }
]

type UserOperationReceiptWithBigIntAsHex = {
  userOpHash: Hash
  sender: Address
  nonce: Hex
  actualGasUsed: Hex
  actualGasCost: Hex
  success: boolean
  receipt: {
    transactionHash: Hex
    transactionIndex: Hex
    blockHash: Hash
    blockNumber: Hex
    from: Address
    to: Address | null
    cumulativeGasUsed: Hex
    status: "0x0" | "0x1"
    gasUsed: Hex
    contractAddress: Address | null
    logsBloom: Hex
    effectiveGasPrice: Hex
  }
  logs: {
    data: Hex
    blockNumber: Hex
    blockHash: Hash
    transactionHash: Hash
    logIndex: Hex
    transactionIndex: Hex
    address: Address
    topics: Hex[]
  }[]
}

export type StateOverrides = {
  [x: string]: {
    balance?: bigint | undefined
    nonce?: bigint | number | undefined
    code?: Hex | undefined
    state?: {
      [x: Hex]: Hex
    }
    stateDiff?: {
      [x: Hex]: Hex
    }
  }
}
