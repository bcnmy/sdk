**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / signTypedData

# Function: signTypedData()

> **signTypedData**\<`TTypedData`, `TPrimaryType`, `TChain`, `TAccount`\>(`client`, `parameters`): `Promise`\<`SignTypedDataReturnType`\>

Signs typed data and calculates an Ethereum-specific signature in [https://eips.ethereum.org/EIPS/eip-712](https://eips.ethereum.org/EIPS/eip-712): `sign(keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message)))`

- Docs: https://viem.sh/docs/actions/wallet/signTypedData.html
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`eth_signTypedData_v4`](https://docs.metamask.io/guide/signing-data.html#signtypeddata-v4)
  - Local Accounts: Signs locally. No JSON-RPC request.

## Type parameters

• **TTypedData** extends `Object` \| `Object`

• **TPrimaryType** extends `string`

• **TChain** extends `undefined` \| `Chain`

• **TAccount** extends `undefined` \| [`SmartAccount`](../type-aliases/SmartAccount.md)

## Parameters

• **client**: `Client`\<`Transport`, `TChain`, `TAccount`\>

Client to use

• **parameters**: `SignTypedDataParameters`\<`TTypedData`, `TPrimaryType`, [`SmartAccount`](../type-aliases/SmartAccount.md)\>

SignTypedDataParameters

## Returns

`Promise`\<`SignTypedDataReturnType`\>

The signed data. SignTypedDataReturnType

## Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'
import { signTypedData } from 'viem/wallet'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const signature = await signTypedData(client, {
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

## Example

```ts
// Account Hoisting
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { signTypedData } from 'viem/wallet'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: http(),
})
const signature = await signTypedData(client, {
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

## Source

[accounts/actions/signTypedData.ts:113](https://github.com/bcnmy/sdk/blob/main/src/accounts/actions/signTypedData.ts#L113)
