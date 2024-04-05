**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / SponsorUserOperationParameters

# Type alias: SponsorUserOperationParameters

> **SponsorUserOperationParameters**: `Object`

## Type declaration

### calculateGasLimits?

> **`optional`** **calculateGasLimits**: `boolean`

### expiryDuration?

> **`optional`** **expiryDuration**: `number`

### mode

> **mode**: [`PaymasterMode`](../enumerations/PaymasterMode.md)

### tokenInfo?

> **`optional`** **tokenInfo**: [`FeeTokenInfo`](FeeTokenInfo.md)

### userOperation

> **userOperation**: [`UserOperationStruct`](UserOperationStruct.md)

### webhookData?

> **`optional`** **webhookData**: `Record`\<`string`, `any`\>

Webhooks to be fired after user op is sent

## Source

[paymaster/utils/types.ts:32](https://github.com/bcnmy/sdk/blob/main/src/paymaster/utils/types.ts#L32)
