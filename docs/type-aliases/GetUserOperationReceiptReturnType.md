**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / GetUserOperationReceiptReturnType

# Type alias: GetUserOperationReceiptReturnType

> **GetUserOperationReceiptReturnType**: `Object`

## Type declaration

### actualGasCost

> **actualGasCost**: `bigint`

### actualGasUsed

> **actualGasUsed**: `bigint`

### logs

> **logs**: `Object`[]

### nonce

> **nonce**: `bigint`

### receipt

> **receipt**: `Object`

### receipt.blockHash

> **blockHash**: `Hash`

### receipt.blockNumber

> **blockNumber**: `bigint`

### receipt.contractAddress

> **contractAddress**: `Address` \| `null`

### receipt.cumulativeGasUsed

> **cumulativeGasUsed**: `bigint`

### receipt.effectiveGasPrice

> **effectiveGasPrice**: `bigint`

### receipt.from

> **from**: `Address`

### receipt.gasUsed

> **gasUsed**: `bigint`

### receipt.logsBloom

> **logsBloom**: `Hex`

### receipt.status

> **status**: [`TStatus`](TStatus.md)

### receipt.to

> **to**: `Address` \| `null`

### receipt.transactionHash

> **transactionHash**: `Hex`

### receipt.transactionIndex

> **transactionIndex**: `bigint`

### sender

> **sender**: `Address`

### success

> **success**: `boolean`

### userOpHash

> **userOpHash**: `Hash`

## Source

[client/utils/types.ts:27](https://github.com/bcnmy/sdk/blob/main/src/client/utils/types.ts#L27)
