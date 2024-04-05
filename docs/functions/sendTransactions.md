**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / sendTransactions

# Function: sendTransactions()

> **sendTransactions**\<`TChain`, `TAccount`\>(`client`, `args`): `Promise`\<`Hash`\>

Creates, signs, and sends a new transactions to the network.
This function also allows you to sponsor this transaction if sender is a smartAccount

## Type parameters

• **TChain** extends `undefined` \| `Chain`

• **TAccount** extends `undefined` \| [`SmartAccount`](../type-aliases/SmartAccount.md)

## Parameters

• **client**: `Client`\<`Transport`, `TChain`, `TAccount`\>

Client to use

• **args**: `{ [K in string | number | symbol]: SendTransactionsWithPaymasterParameters<TAccount>[K] }`

## Returns

`Promise`\<`Hash`\>

The [Transaction](https://viem.sh/docs/glossary/terms.html#transaction) hash.

## Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'
import { sendTransaction } from 'viem/wallet'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const hash = await sendTransaction(client, [{
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n,
}, {
  to: '0x61897970c51812dc3a010c7d01b50e0d17dc1234',
  value: 10000000000000000n,
}])
```

## Example

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { sendTransaction } from 'viem/wallet'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})
const hash = await sendTransactions(client, [{
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n,
}, {
  to: '0x61897970c51812dc3a010c7d01b50e0d17dc1234',
  value: 10000000000000000n,
}])
```

## Source

[accounts/actions/sendTransactions.ts:68](https://github.com/bcnmy/sdk/blob/main/src/accounts/actions/sendTransactions.ts#L68)
