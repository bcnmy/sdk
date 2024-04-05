**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / getUserOperationByHash

# Function: getUserOperationByHash()

> **getUserOperationByHash**\<`TTransport`, `TChain`, `TAccount`\>(`client`, `args`): `Promise`\<`null` \| `Object`\>

Returns the user operation from userOpHash

- Docs: https://docs.biconomy.io/ ... // TODO

## Type parameters

• **TTransport** extends `Transport` = `Transport`

• **TChain** extends `undefined` \| `Chain` = `undefined` \| `Chain`

• **TAccount** extends `undefined` \| `Account` = `undefined` \| `Account`

## Parameters

• **client**: `Client`\<`TTransport`, `TChain`, `TAccount`, [`BundlerRpcSchema`](../type-aliases/BundlerRpcSchema.md)\>

[BundlerClient](../type-aliases/BundlerClient.md) that you created using viem's createClient and extended it with bundlerActions.

• **args**

[GetUserOperationByHashParameters](../type-aliases/GetUserOperationByHashParameters.md) UserOpHash that was returned by [sendUserOperation](sendUserOperation.md)

• **args\.hash**: ```0x${string}```

## Returns

`Promise`\<`null` \| `Object`\>

userOperation along with entryPoint, transactionHash, blockHash, blockNumber if found or null

## Example

```ts
import { createClient } from "viem"
import { getUserOperationByHash } from "@biconomy/sdk" // TODO

const bundlerClient = createClient({
     chain: goerli,
     transport: http(BUNDLER_URL)
})

getUserOperationByHash(bundlerClient, {hash: userOpHash})
```

## Source

[bundler/actions/getUserOperationByHash.ts:40](https://github.com/bcnmy/sdk/blob/main/src/bundler/actions/getUserOperationByHash.ts#L40)
