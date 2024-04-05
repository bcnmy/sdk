**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / FeeQuotesOrDataERC20Response

# Type alias: FeeQuotesOrDataERC20Response

> **FeeQuotesOrDataERC20Response**: `Object`

## Type declaration

### callGasLimit?

> **`optional`** **callGasLimit**: [`BigNumberish`](BigNumberish.md)

### feeQuotes?

> **`optional`** **feeQuotes**: [`PaymasterFeeQuote`](PaymasterFeeQuote.md)[]

Array of results from the paymaster

### mode

> **mode**: [`PaymasterMode`](../enumerations/PaymasterMode.md)

### paymasterAddress?

> **`optional`** **paymasterAddress**: `Hex`

Normally set to the spender in the proceeding call to send the tx

### paymasterAndData?

> **`optional`** **paymasterAndData**: `Uint8Array` \| `Hex`

Relevant Data returned from the paymaster

### preVerificationGas?

> **`optional`** **preVerificationGas**: [`BigNumberish`](BigNumberish.md)

### verificationGasLimit?

> **`optional`** **verificationGasLimit**: [`BigNumberish`](BigNumberish.md)

## Source

[paymaster/utils/types.ts:124](https://github.com/bcnmy/sdk/blob/main/src/paymaster/utils/types.ts#L124)
