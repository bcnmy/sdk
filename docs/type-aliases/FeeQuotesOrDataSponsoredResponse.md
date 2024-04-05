**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / FeeQuotesOrDataSponsoredResponse

# Type alias: FeeQuotesOrDataSponsoredResponse

> **FeeQuotesOrDataSponsoredResponse**: `Object`

## Type declaration

### callGasLimit?

> **`optional`** **callGasLimit**: [`BigNumberish`](BigNumberish.md)

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

### userOpHash

> **userOpHash**: `Hash`

### verificationGasLimit?

> **`optional`** **verificationGasLimit**: [`BigNumberish`](BigNumberish.md)

## Source

[paymaster/utils/types.ts:109](https://github.com/bcnmy/sdk/blob/main/src/paymaster/utils/types.ts#L109)
