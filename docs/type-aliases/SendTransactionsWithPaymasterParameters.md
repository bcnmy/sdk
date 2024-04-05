**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / SendTransactionsWithPaymasterParameters

# Type alias: SendTransactionsWithPaymasterParameters\<TAccount\>

> **SendTransactionsWithPaymasterParameters**\<`TAccount`\>: `Object` & [`GetAccountParameter`](GetAccountParameter.md)\<`TAccount`\> & [`Middleware`](Middleware.md) & `Object`

## Type declaration

### transactions

> **transactions**: `Object`[]

## Type declaration

### maxFeePerGas?

> **`optional`** **maxFeePerGas**: `Hex`

### maxPriorityFeePerGas?

> **`optional`** **maxPriorityFeePerGas**: `Hex`

### nonce?

> **`optional`** **nonce**: `Hex`

## Type parameters

• **TAccount** extends [`SmartAccount`](SmartAccount.md) \| `undefined` = [`SmartAccount`](SmartAccount.md) \| `undefined`

## Source

[accounts/actions/sendTransactions.ts:12](https://github.com/bcnmy/sdk/blob/main/src/accounts/actions/sendTransactions.ts#L12)
