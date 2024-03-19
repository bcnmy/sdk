import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types/entrypoint"
import type { Address, Hash, Hex } from "viem"
import type { PartialBy } from "viem/chains"
import type { UserOperationStruct } from "../../accounts"

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
  initCode: Hex
  paymasterAndData?: never
}

export type BundlerRpcSchema = [
  {
    Method: "eth_sendUserOperation"
    Parameters: [
      userOperation: UserOperationWithBigIntAsHex,
      entryPoint: ENTRYPOINT_ADDRESS_V06_TYPE
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
      entryPoint: ENTRYPOINT_ADDRESS_V06_TYPE,
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
      entryPoint: ENTRYPOINT_ADDRESS_V06_TYPE
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

export type EstimateUserOperationGasParameters = {
  userOperation: PartialBy<
    UserOperationStruct,
    "callGasLimit" | "preVerificationGas" | "verificationGasLimit"
  >
}

export type WaitForUserOperationReceiptParameters = {
  /** The hash of the transaction. */
  hash: Hash
  /**
   * Polling frequency (in ms). Defaults to the client's pollingInterval config.
   * @default client.pollingInterval
   */
  pollingInterval?: number
  /** Optional timeout (in milliseconds) to wait before stopping polling. */
  timeout?: number
}

export type TStatus = "success" | "reverted"

export type GetUserOperationReceiptReturnType = {
  userOpHash: Hash
  sender: Address
  nonce: bigint
  actualGasUsed: bigint
  actualGasCost: bigint
  success: boolean
  receipt: {
    transactionHash: Hex
    transactionIndex: bigint
    blockHash: Hash
    blockNumber: bigint
    from: Address
    to: Address | null
    cumulativeGasUsed: bigint
    status: TStatus
    gasUsed: bigint
    contractAddress: Address | null
    logsBloom: Hex
    effectiveGasPrice: bigint
  }
  logs: {
    data: Hex
    blockNumber: bigint
    blockHash: Hash
    transactionHash: Hash
    logIndex: bigint
    transactionIndex: bigint
    address: Address
    topics: Hex[]
  }[]
}

export type GetUserOperationByHashParameters = {
  hash: Hash
}
