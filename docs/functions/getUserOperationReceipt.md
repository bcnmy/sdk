**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / getUserOperationReceipt

# Function: getUserOperationReceipt()

> **getUserOperationReceipt**\<`TTransport`, `TChain`, `TAccount`\>(`client`, `args`): `Promise`\<`null` \| `Object`\>

Returns the user operation receipt from userOpHash

- Docs: https://docs.biconomy.io/ ... // TODO

## Type parameters

• **TTransport** extends `Transport` = `Transport`

• **TChain** extends `undefined` \| `Chain` = `undefined` \| `Chain`

• **TAccount** extends `undefined` \| `Account` = `undefined` \| `Account`

## Parameters

• **client**: `Client`\<`TTransport`, `TChain`, `TAccount`, [`BundlerRpcSchema`](../type-aliases/BundlerRpcSchema.md)\>

[BundlerClient](../type-aliases/BundlerClient.md) that you created using viem's createClient and extended it with bundlerActions.

• **args**

[GetUserOperationReceiptParameters](../type-aliases/GetUserOperationReceiptParameters.md) UserOpHash that was returned by [sendUserOperation](sendUserOperation.md)

• **args\.hash**: ```0x${string}```

## Returns

`Promise`\<`null` \| `Object`\>

user operation receipt [GetUserOperationReceiptReturnType](../type-aliases/GetUserOperationReceiptReturnType.md) if found or null

## Example

```ts
import { createClient } from "viem"
import { getUserOperationReceipt } from "@biconomy/sdk"

const bundlerClient = createClient({
     chain: goerli,
     transport: http(BUNDLER_URL)
})

getUserOperationReceipt(bundlerClient, {hash: userOpHash})
```

## Source

[bundler/actions/getUserOperationReceipt.ts:31](https://github.com/bcnmy/sdk/blob/main/src/bundler/actions/getUserOperationReceipt.ts#L31)
