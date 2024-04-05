**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / signMessage

# Function: signMessage()

> **signMessage**\<`TChain`, `TAccount`\>(`client`, `parameters`): `Promise`\<`SignMessageReturnType`\>

Calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.

- Docs: https://viem.sh/docs/actions/wallet/signMessage.html
- JSON-RPC Methods:
  - JSON-RPC Accounts: [`personal_sign`](https://docs.metamask.io/guide/signing-data.html#personal-sign)
  - Local Accounts: Signs locally. No JSON-RPC request.

With the calculated signature, you can:
- use [`verifyMessage`](https://viem.sh/docs/utilities/verifyMessage.html) to verify the signature,
- use [`recoverMessageAddress`](https://viem.sh/docs/utilities/recoverMessageAddress.html) to recover the signing address from a signature.

## Type parameters

• **TChain** extends `undefined` \| `Chain`

• **TAccount** extends `undefined` \| [`SmartAccount`](../type-aliases/SmartAccount.md)

## Parameters

• **client**: `Client`\<`Transport`, `TChain`, `TAccount`\>

Client to use

• **parameters**: `SignMessageParameters`\<[`SmartAccount`](../type-aliases/SmartAccount.md)\>

SignMessageParameters

## Returns

`Promise`\<`SignMessageReturnType`\>

The signed message. SignMessageReturnType

## Example

```ts
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'
import { signMessage } from 'viem/wallet'

const client = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})
const signature = await signMessage(client, {
  account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  message: 'hello world',
})
```

## Example

```ts
// Account Hoisting
import { createWalletClient, custom } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { signMessage } from 'viem/wallet'

const client = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: mainnet,
  transport: custom(window.ethereum),
})
const signature = await signMessage(client, {
  message: 'hello world',
})
```

## Source

[accounts/actions/signMessage.ts:57](https://github.com/bcnmy/sdk/blob/main/src/accounts/actions/signMessage.ts#L57)
