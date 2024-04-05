**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / sendTransaction

# Function: sendTransaction()

> **sendTransaction**\<`TChain`, `TAccount`, `TChainOverride`\>(`client`, `args`): `Promise`\<`Hash`\>

Creates, signs, and sends a new transaction to the network.
This function also allows you to sponsor this transaction if sender is a smartAccount

- Docs: https://viem.sh/docs/actions/wallet/sendTransaction.html
- Examples: https://stackblitz.com/github/wagmi-dev/viem/tree/main/examples/transactions/sending-transactions
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`eth_sendTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendtransaction)
  - Local Accounts: [`eth_sendRawTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendrawtransaction)

## Type parameters

• **TChain** extends `undefined` \| `Chain`

• **TAccount** extends `undefined` \| [`SmartAccount`](../type-aliases/SmartAccount.md)

• **TChainOverride** extends `undefined` \| `Chain` = `undefined` \| `Chain`

## Parameters

• **client**: `Client`\<`Transport`, `TChain`, `TAccount`\>

Client to use

• **args**: `{ [K in string | number | symbol]: SendTransactionWithPaymasterParameters<TChain, TAccount, TChainOverride>[K] }`

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
const hash = await sendTransaction(client, {
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n,
})
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
const hash = await sendTransaction(client, {
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n,
})
```

## Source

[accounts/actions/sendTransaction.ts:66](https://github.com/bcnmy/sdk/blob/main/src/accounts/actions/sendTransaction.ts#L66)
