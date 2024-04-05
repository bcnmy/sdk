**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / WaitForUserOperationReceiptParameters

# Type alias: WaitForUserOperationReceiptParameters

> **WaitForUserOperationReceiptParameters**: `Object`

## Type declaration

### hash

> **hash**: `Hash`

The hash of the transaction.

### pollingInterval?

> **`optional`** **pollingInterval**: `number`

Polling frequency (in ms). Defaults to the client's pollingInterval config.

#### Default

```ts
client.pollingInterval
```

### timeout?

> **`optional`** **timeout**: `number`

Optional timeout (in milliseconds) to wait before stopping polling.

## Source

[bundler/actions/waitForUserOperationReceipt.ts:26](https://github.com/bcnmy/sdk/blob/main/src/bundler/actions/waitForUserOperationReceipt.ts#L26)
