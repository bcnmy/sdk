**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / chainId

# Function: chainId()

> **chainId**\<`TTransport`, `TChain`, `TAccount`\>(`client`): `Promise`\<`number`\>

Returns the supported chain id by the bundler service

## Type parameters

• **TTransport** extends `Transport` = `Transport`

• **TChain** extends `undefined` \| `Chain` = `undefined` \| `Chain`

• **TAccount** extends `undefined` \| `Account` = `undefined` \| `Account`

## Parameters

• **client**: `Client`\<`TTransport`, `TChain`, `TAccount`\>

[BundlerClient](../type-aliases/BundlerClient.md) that you created using viem's createClient and extended it with bundlerActions.

## Returns

`Promise`\<`number`\>

Supported chain id

## Example

```ts
import { createClient } from "viem"

const bundlerClient = createClient({
     chain: polygonMumbai,
     transport: http(BUNDLER_URL)
})

const bundlerChainId = chainId(bundlerClient)
// Return 80001 for Mumbai
```

## Source

[bundler/actions/chainId.ts:21](https://github.com/bcnmy/sdk/blob/main/src/bundler/actions/chainId.ts#L21)
