**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / prepareUserOperationRequest

# Function: prepareUserOperationRequest()

> **prepareUserOperationRequest**\<`TTransport`, `TChain`, `TAccount`\>(`client`, `args`, `stateOverrides`?): `Promise`\<[`UserOperationStruct`](../type-aliases/UserOperationStruct.md)\>

## Type parameters

• **TTransport** extends `Transport` = `Transport`

• **TChain** extends `undefined` \| `Chain` = `undefined` \| `Chain`

• **TAccount** extends `undefined` \| [`SmartAccount`](../type-aliases/SmartAccount.md) = `undefined` \| [`SmartAccount`](../type-aliases/SmartAccount.md)

## Parameters

• **client**: `Client`\<`TTransport`, `TChain`, `TAccount`\>

• **args**

• **args\.account?**: [`SmartAccount`](../type-aliases/SmartAccount.md)\<`string`, `Transport`, `undefined` \| `Chain`, `Abi`\>

• **args\.middleware?**: `Object` \| (`args`) => `Promise`\<[`UserOperationStruct`](../type-aliases/UserOperationStruct.md)\>

• **args\.userOperation?**: `PartialBy`\<[`UserOperationStruct`](../type-aliases/UserOperationStruct.md), `"callGasLimit"` \| `"preVerificationGas"` \| `"verificationGasLimit"` \| `"sender"` \| `"nonce"` \| `"initCode"` \| `"maxFeePerGas"` \| `"maxPriorityFeePerGas"` \| `"paymasterAndData"` \| `"signature"`\>

• **stateOverrides?**: [`StateOverrides`](../type-aliases/StateOverrides.md)

## Returns

`Promise`\<[`UserOperationStruct`](../type-aliases/UserOperationStruct.md)\>

## Source

[accounts/actions/prepareUserOperationRequest.ts:169](https://github.com/bcnmy/sdk/blob/main/src/accounts/actions/prepareUserOperationRequest.ts#L169)
