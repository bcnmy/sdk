**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / createSmartAccountClient

# Function: createSmartAccountClient()

> **createSmartAccountClient**\<`TSmartAccount`, `TTransport`, `TChain`\>(`parameters`): [`SmartAccountClient`](../type-aliases/SmartAccountClient.md)\<`TTransport`, `TChain`, `TSmartAccount`\>

Creates a EIP-4337 compliant Bundler Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).

- Docs:

A Bundler Client is an interface to "erc 4337" [JSON-RPC API](https://eips.ethereum.org/EIPS/eip-4337#rpc-methods-eth-namespace) methods such as sending user operation, estimating gas for a user operation, get user operation receipt, etc through Bundler Actions.

## Type parameters

• **TSmartAccount** extends [`SmartAccount`](../type-aliases/SmartAccount.md)

• **TTransport** extends `Transport` = `Transport`

• **TChain** extends `Chain` = `Chain`

## Parameters

• **parameters**

WalletClientConfig

• **parameters\.account**: `undefined` \| [`SmartAccount`](../type-aliases/SmartAccount.md)

• **parameters\.bundlerTransport**: `Transport`

• **parameters\.cacheTime?**: `number`

Time (in ms) that cached data will remain in memory.

**Default**
```ts
4_000
```

• **parameters\.chain?**: `Chain` \| `TChain`

Chain for the client.

• **parameters\.key?**: `string`

A key for the client.

• **parameters\.middleware?**: `Object` \| (`args`) => `Promise`\<[`UserOperationStruct`](../type-aliases/UserOperationStruct.md)\>

• **parameters\.name?**: `string`

A name for the client.

• **parameters\.pollingInterval?**: `number`

Frequency (in ms) for polling enabled actions & events.

**Default**
```ts
4_000
```

## Returns

[`SmartAccountClient`](../type-aliases/SmartAccountClient.md)\<`TTransport`, `TChain`, `TSmartAccount`\>

A Bundler Client. [SmartAccountClient](../type-aliases/SmartAccountClient.md)

## Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const smartAccountClient = createSmartAccountClient({
  chain: mainnet,
  transport: http(BUNDLER_URL),
})
```

## Source

[client/createSmartAccountClient.ts:52](https://github.com/bcnmy/sdk/blob/main/src/client/createSmartAccountClient.ts#L52)
