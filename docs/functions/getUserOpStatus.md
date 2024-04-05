**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / getUserOpStatus

# Function: getUserOpStatus()

> **getUserOpStatus**\<`TTransport`, `TChain`, `TAccount`\>(`client`, `userOpHash`): `Promise`\<[`UserOpStatus`](../type-aliases/UserOpStatus.md)\>

## Type parameters

• **TTransport** extends `Transport` = `Transport`

• **TChain** extends `undefined` \| `Chain` = `undefined` \| `Chain`

• **TAccount** extends `undefined` \| `Account` = `undefined` \| `Account`

## Parameters

• **client**: `Client`\<`TTransport`, `TChain`, `TAccount`, [`BundlerRpcSchema`](../type-aliases/BundlerRpcSchema.md)\>

• **userOpHash**: ```0x${string}```

## Returns

`Promise`\<[`UserOpStatus`](../type-aliases/UserOpStatus.md)\>

## Source

[bundler/actions/getUserOperationStatus.ts:4](https://github.com/bcnmy/sdk/blob/main/src/bundler/actions/getUserOperationStatus.ts#L4)
