**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / sendUserOperation

# Function: sendUserOperation()

> **sendUserOperation**\<`TTransport`, `TChain`, `TAccount`\>(`client`, `args`): `Promise`\<`Hash`\>

## Type parameters

• **TTransport** extends `Transport` = `Transport`

• **TChain** extends `undefined` \| `Chain` = `undefined` \| `Chain`

• **TAccount** extends `undefined` \| [`SmartAccount`](../type-aliases/SmartAccount.md) = `undefined` \| [`SmartAccount`](../type-aliases/SmartAccount.md)

## Parameters

• **client**: `Client`\<`TTransport`, `TChain`, `TAccount`\>

• **args**

• **args\.account?**: [`SmartAccount`](../type-aliases/SmartAccount.md)\<`string`, `Transport`, `undefined` \| `Chain`, `Abi`\>

• **args\.middleware?**: `Object` \| (`args`) => `Promise`\<[`UserOperationStruct`](../type-aliases/UserOperationStruct.md)\>

• **args\.userOperation**: `PartialBy`\<[`UserOperationStruct`](../type-aliases/UserOperationStruct.md), `"callGasLimit"` \| `"preVerificationGas"` \| `"verificationGasLimit"` \| `"sender"` \| `"nonce"` \| `"initCode"` \| `"maxFeePerGas"` \| `"maxPriorityFeePerGas"` \| `"paymasterAndData"` \| `"signature"`\>

## Returns

`Promise`\<`Hash`\>

## Source

[accounts/actions/sendUserOperation.ts:32](https://github.com/bcnmy/sdk/blob/main/src/accounts/actions/sendUserOperation.ts#L32)
