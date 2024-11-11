import type { Address, Hash, Hex, Log } from "viem"

/** Represents the status of a transaction. */
export type TStatus = "success" | "reverted"

/**
 * Represents the transaction details in a user operation receipt.
 */
export type UserOpReceiptTransaction = {
  /** The hash of the transaction. */
  transactionHash: Hex
  /** The index of the transaction within the block. */
  transactionIndex: bigint
  /** The hash of the block containing this transaction. */
  blockHash: Hash
  /** The number of the block containing this transaction. */
  blockNumber: bigint
  /** The address of the sender. */
  from: Address
  /** The address of the recipient, or null for contract creation transactions. */
  to: Address | null
  /** The total amount of gas used in the block up to and including this transaction. */
  cumulativeGasUsed: bigint
  /** The status of the transaction: success or reverted. */
  status: TStatus
  /** The amount of gas used by this specific transaction. */
  gasUsed: bigint
  /** The address of the created contract, or null if the transaction was not a contract creation. */
  contractAddress: Address | null
  /** A 2048-bit bloom filter from the logs of the transaction. */
  logsBloom: Hex
  /** The price per gas that was actually used for the transaction. */
  effectiveGasPrice: bigint
}

/**
 * Represents a receipt for a user operation.
 */
export type UserOpReceipt = {
  /** The hash of the user operation. */
  userOpHash: Hash
  /** The address of the entry point contract. */
  entryPoint: Address
  /** The address of the sender account. */
  sender: Address
  /** The nonce of the user operation. */
  nonce: bigint
  /** The address of the paymaster, if used. */
  paymaster?: Address
  /** The actual amount of gas used by the user operation. */
  actualGasUsed: bigint
  /** The actual cost
  of gas for the user operation. */
  actualGasCost: bigint
  /** Indicates whether the user operation was successful
  or not. */
  success: boolean
  /** The reason for failure, if any. */
  reason?: string
  /** The transaction details. */
  receipt: UserOpReceiptTransaction
  /** The logs of the user operation. */
  logs: Log[]
}

export type Service = "Bundler" | "Paymaster"
export type BigNumberish = Hex | number | bigint
export type BytesLike = Uint8Array | Hex | string

export type EIP712DomainReturn = [
  Hex,
  string,
  string,
  bigint,
  Address,
  Hex,
  bigint[]
]

export type AccountMetadata = {
  name: string
  version: string
  chainId: bigint
}

export type TypeField = {
  name: string
  type: string
}

export type TypeDefinition = {
  [key: string]: TypeField[]
}

export type GetNonceArgs = {
  key?: bigint | undefined
  validationMode?: "0x00" | "0x01"
}
export type Call = {
  to: Hex
  data?: Hex | undefined
  value?: bigint | undefined
}
