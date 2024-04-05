**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / sendUserOperationWithBundler

# Function: sendUserOperationWithBundler()

> **sendUserOperationWithBundler**\<`TTransport`, `TChain`, `TAccount`\>(`client`, `args`): `Promise`\<```0x${string}```\>

Sends user operation to the bundler

- Docs: https://docs.biconomy.io/ ... // TODO

## Type parameters

• **TTransport** extends `Transport` = `Transport`

• **TChain** extends `undefined` \| `Chain` = `undefined` \| `Chain`

• **TAccount** extends `undefined` \| `Account` = `undefined` \| `Account`

## Parameters

• **client**: `Client`\<`TTransport`, `TChain`, `TAccount`, [`BundlerRpcSchema`](../type-aliases/BundlerRpcSchema.md)\>

[BundlerClient](../type-aliases/BundlerClient.md) that you created using viem's createClient and extended it with bundlerActions.

• **args**

[SendUserOperationParameters](../type-aliases/SendUserOperationParameters.md).

• **args\.account?**: [`SmartAccount`](../type-aliases/SmartAccount.md)\<`string`, `Transport`, `undefined` \| `Chain`, `Abi`\>

• **args\.middleware?**: `Object` \| (`args`) => `Promise`\<[`UserOperationStruct`](../type-aliases/UserOperationStruct.md)\>

• **args\.userOperation**: `PartialBy`\<[`UserOperationStruct`](../type-aliases/UserOperationStruct.md), `"callGasLimit"` \| `"preVerificationGas"` \| `"verificationGasLimit"` \| `"sender"` \| `"nonce"` \| `"initCode"` \| `"maxFeePerGas"` \| `"maxPriorityFeePerGas"` \| `"paymasterAndData"` \| `"signature"`\>

## Returns

`Promise`\<```0x${string}```\>

UserOpHash that you can use to track user operation as Hash.

## Example

```ts
import { createClient } from "viem"
import { sendUserOperation } from "@biconomy/sdk" // TODO

const bundlerClient = createClient({
     chain: goerli,
     transport: http(BUNDLER_URL)
})

const userOpHash = sendUserOperation(bundlerClient, {
     userOperation: signedUserOperation,
     entryPoint: entryPoint
})

// Return '0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34'
```

## Source

[bundler/actions/sendUserOperation.ts:37](https://github.com/bcnmy/sdk/blob/main/src/bundler/actions/sendUserOperation.ts#L37)
