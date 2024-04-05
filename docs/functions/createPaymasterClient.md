**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / createPaymasterClient

# Function: createPaymasterClient()

> **createPaymasterClient**\<`transport`, `chain`\>(`parameters`): [`PaymasterClient`](../type-aliases/PaymasterClient.md)\<`undefined` \| `Chain`\>

Creates a Paymaster Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).

A Paymaster Client is an interface to "paymaster endpoints" [JSON-RPC API](https://docs..io/reference/verifying-paymaster/endpoints) methods such as sponsoring user operation, etc through Paymaster Actions.

## Type parameters

• **transport** extends `Transport` = `Transport`

• **chain** extends `undefined` \| `Chain` = `undefined`

## Parameters

• **parameters**

• **parameters\.batch?**

Flags for batch settings.

• **parameters\.batch\.multicall?**: `boolean` \| `Object`

Toggle to enable `eth_call` multicall aggregation.

• **parameters\.cacheTime?**: `number`

Time (in ms) that cached data will remain in memory.

**Default**
```ts
4_000
```

• **parameters\.chain?**: `Chain` \| `chain`

Chain for the client.

• **parameters\.key?**: `string`

A key for the client.

• **parameters\.name?**: `string`

A name for the client.

• **parameters\.pollingInterval?**: `number`

Frequency (in ms) for polling enabled actions & events.

**Default**
```ts
4_000
```

• **parameters\.transport**: `transport`

The RPC transport

## Returns

[`PaymasterClient`](../type-aliases/PaymasterClient.md)\<`undefined` \| `Chain`\>

A  Paymaster Client. [PaymasterClient](../type-aliases/PaymasterClient.md)

## Example

```ts
import { createPublicClient, http } from 'viem'
import { polygonMumbai } from 'viem/chains'

const PaymasterClient = createPaymasterClient({
  chain: polygonMumbai,
  transport: http("https://paymaster.biconomy.io/api/v1/80001/YOUR_API_KEY_HERE"),
})
```

## Source

[paymaster/createPaymasterClient.ts:43](https://github.com/bcnmy/sdk/blob/main/src/paymaster/createPaymasterClient.ts#L43)
