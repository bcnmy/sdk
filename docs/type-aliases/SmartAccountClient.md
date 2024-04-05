**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / SmartAccountClient

# Type alias: SmartAccountClient\<transport, chain, account\>

> **SmartAccountClient**\<`transport`, `chain`, `account`\>: `Prettify`\<`Client`\<`transport`, `chain`, `account`, [`BundlerRpcSchema`](BundlerRpcSchema.md), [`SmartAccountActions`](SmartAccountActions.md)\<`chain`, `account`\>\>\>

## Type parameters

• **transport** extends `Transport` = `Transport`

• **chain** extends `Chain` \| `undefined` = `Chain` \| `undefined`

• **account** extends [`SmartAccount`](SmartAccount.md) \| `undefined` = [`SmartAccount`](SmartAccount.md) \| `undefined`

## Source

[client/createSmartAccountClient.ts:18](https://github.com/bcnmy/sdk/blob/main/src/client/createSmartAccountClient.ts#L18)
