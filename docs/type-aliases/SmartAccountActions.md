**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / SmartAccountActions

# Type alias: SmartAccountActions\<TChain, TSmartAccount\>

> **SmartAccountActions**\<`TChain`, `TSmartAccount`\>: `Object`

## Type parameters

• **TChain** extends `Chain` \| `undefined` = `Chain` \| `undefined`

• **TSmartAccount** extends [`SmartAccount`](SmartAccount.md) \| `undefined` = [`SmartAccount`](SmartAccount.md) \| `undefined`

## Type declaration

### prepareUserOperationRequest()

> **prepareUserOperationRequest**: \<`TTransport`\>(`args`, `stateOverrides`?) => `Promise`\<`Prettify`\<[`UserOperationStruct`](UserOperationStruct.md)\>\>

Executes a write function on a contract.
This function also allows you to sponsor this transaction if sender is a smartAccount

- Docs: https://viem.sh/docs/contract/writeContract.html
- Examples: https://stackblitz.com/github/wagmi-dev/viem/tree/main/examples/contracts/writing-to-contracts

A "write" function on a Solidity contract modifies the state of the blockchain. These types of functions require gas to be executed, and hence a [Transaction](https://viem.sh/docs/glossary/terms.html) is needed to be broadcast in order to change the state.

Internally, uses a [Wallet Client](https://viem.sh/docs/clients/wallet.html) to call the [`sendTransaction` action](https://viem.sh/docs/actions/wallet/sendTransaction.html) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData.html).

__Warning: The `write` internally sends a transaction – it does not validate if the contract write will succeed (the contract may throw an error). It is highly recommended to [simulate the contract write with `contract.simulate`](https://viem.sh/docs/contract/writeContract.html#usage) before you execute it.__

#### Example

```ts
import { createWalletClient, custom, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const hash = await client.writeContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: parseAbi(['function mint(uint32 tokenId) nonpayable']),
  functionName: 'mint',
  args: [69420],
})
```

#### Example

```ts
// With Validation
import { createWalletClient, custom, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const { request } = await client.simulateContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: parseAbi(['function mint(uint32 tokenId) nonpayable']),
  functionName: 'mint',
  args: [69420],
}
const hash = await client.writeContract(request)
```

#### Type parameters

• **TTransport** extends `Transport`

#### Parameters

• **args**: `Prettify`\<`Parameters`\<*typeof* [`prepareUserOperationRequest`](../functions/prepareUserOperationRequest.md)\>\[`1`\]\>

WriteContractParameters

• **stateOverrides?**: [`StateOverrides`](StateOverrides.md)

#### Returns

`Promise`\<`Prettify`\<[`UserOperationStruct`](UserOperationStruct.md)\>\>

### sendTransaction()

> **sendTransaction**: \<`TChainOverride`\>(`args`) => `Promise`\<`Hash`\>

Creates, signs, and sends a new transaction to the network.
This function also allows you to sponsor this transaction if sender is a smartAccount

- Docs: https://viem.sh/docs/actions/wallet/sendTransaction.html
- Examples: https://stackblitz.com/github/wagmi-dev/viem/tree/main/examples/transactions/sending-transactions
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`eth_sendTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendtransaction)
  - Local Accounts: [`eth_sendRawTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendrawtransaction)

#### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const hash = await client.sendTransaction({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n,
})
```

#### Example

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})
const hash = await client.sendTransaction({
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n,
})
```

#### Type parameters

• **TChainOverride** extends `Chain` \| `undefined`

#### Parameters

• **args**: `SendTransactionParameters`\<`TChain`, `TSmartAccount`, `TChainOverride`\>

[SendTransactionParameters](SendTransactionParameters.md)

#### Returns

`Promise`\<`Hash`\>

### sendTransactions()

> **sendTransactions**: (`args`) => `ReturnType`\<*typeof* [`sendTransactions`](../functions/sendTransactions.md)\>

Creates, signs, and sends a new transaction to the network.
This function also allows you to sponsor this transaction if sender is a smartAccount

- Docs: https://viem.sh/docs/actions/wallet/sendTransaction.html
- Examples: https://stackblitz.com/github/wagmi-dev/viem/tree/main/examples/transactions/sending-transactions
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`eth_sendTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendtransaction)
  - Local Accounts: [`eth_sendRawTransaction`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sendrawtransaction)

#### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const hash = await client.sendTransaction([{
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n
}, {
  to: '0x61897970c51812dc3a010c7d01b50e0d17dc1234',
  value: 10000000000000000n
})
```

#### Example

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})
const hash = await client.sendTransaction([{
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: 1000000000000000000n
}, {
  to: '0x61897970c51812dc3a010c7d01b50e0d17dc1234',
  value: 10000000000000000n
}])
```

#### Parameters

• **args**: `Prettify`\<[`SendTransactionsWithPaymasterParameters`](SendTransactionsWithPaymasterParameters.md)\<`TSmartAccount`\>\>

[SendTransactionParameters](SendTransactionParameters.md)

#### Returns

`ReturnType`\<*typeof* [`sendTransactions`](../functions/sendTransactions.md)\>

### sendUserOperation()

> **sendUserOperation**: \<`TTransport`\>(`args`) => `Promise`\<`Hash`\>

#### Type parameters

• **TTransport** extends `Transport`

#### Parameters

• **args**: `Prettify`\<`Parameters`\<*typeof* [`sendUserOperation`](../functions/sendUserOperation.md)\>\[`1`\]\>

#### Returns

`Promise`\<`Hash`\>

### signMessage()

> **signMessage**: (`args`) => `ReturnType`\<*typeof* [`signMessage`](../functions/signMessage.md)\>

Calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.

- Docs: https://viem.sh/docs/actions/wallet/signMessage.html
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`personal_sign`](https://docs.metamask.io/guide/signing-data.html#personal-sign)
  - Local Accounts: Signs locally. No JSON-RPC request.

With the calculated signature, you can:
- use [`verifyMessage`](https://viem.sh/docs/utilities/verifyMessage.html) to verify the signature,
- use [`recoverMessageAddress`](https://viem.sh/docs/utilities/recoverMessageAddress.html) to recover the signing address from a signature.

#### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const signature = await client.signMessage({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  message: 'hello world',
})
```

#### Example

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})
const signature = await client.signMessage({
  message: 'hello world',
})
```

#### Parameters

• **args**: `Parameters`\<*typeof* [`signMessage`](../functions/signMessage.md)\>\[`1`\]

SignMessageParameters

#### Returns

`ReturnType`\<*typeof* [`signMessage`](../functions/signMessage.md)\>

### signTypedData()

> **signTypedData**: \<`TTypedData`, `TPrimaryType`\>(`args`) => `ReturnType`\<*typeof* [`signTypedData`](../functions/signTypedData.md)\>

Signs typed data and calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.

- Docs: https://viem.sh/docs/actions/wallet/signTypedData.html
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`eth_signTypedData_v4`](https://docs.metamask.io/guide/signing-data.html#signtypeddata-v4)
  - Local Accounts: Signs locally. No JSON-RPC request.

#### Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const signature = await client.signTypedData({
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
})
```

#### Example

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})
const signature = await client.signTypedData({
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
})
```

#### Type parameters

• **TTypedData** extends `TypedData` \| `Object`

• **TPrimaryType** extends `string`

#### Parameters

• **args**: `Parameters`\<*typeof* [`signTypedData`](../functions/signTypedData.md)\>\[`1`\]

SignTypedDataParameters

#### Returns

`ReturnType`\<*typeof* [`signTypedData`](../functions/signTypedData.md)\>

## Source

[client/decorators/smartAccount.ts:41](https://github.com/bcnmy/sdk/blob/main/src/client/decorators/smartAccount.ts#L41)
