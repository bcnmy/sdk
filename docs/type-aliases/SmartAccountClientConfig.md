**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / SmartAccountClientConfig

# Type alias: SmartAccountClientConfig\<transport, chain, account\>

> **SmartAccountClientConfig**\<`transport`, `chain`, `account`\>: `Prettify`\<`Pick`\<`ClientConfig`\<`transport`, `chain`, `account`\>, `"cacheTime"` \| `"chain"` \| `"key"` \| `"name"` \| `"pollingInterval"`\> & [`Middleware`](Middleware.md) & `Object`\>

## Type parameters

• **transport** extends `Transport` = `Transport`

• **chain** extends `Chain` \| `undefined` = `Chain` \| `undefined`

• **account** extends [`SmartAccount`](SmartAccount.md) \| `undefined` = [`SmartAccount`](SmartAccount.md) \| `undefined`

## Source

[client/utils/types.ts:6](https://github.com/bcnmy/sdk/blob/main/src/client/utils/types.ts#L6)
