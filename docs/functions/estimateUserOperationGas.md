**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / estimateUserOperationGas

# Function: estimateUserOperationGas()

> **estimateUserOperationGas**\<`TTransport`, `TChain`, `TAccount`\>(`client`, `args`, `stateOverrides`?): `Promise`\<`Object`\>

## Type parameters

• **TTransport** extends `Transport` = `Transport`

• **TChain** extends `undefined` \| `Chain` = `undefined` \| `Chain`

• **TAccount** extends `undefined` \| `Account` = `undefined` \| `Account`

## Parameters

• **client**: `Client`\<`TTransport`, `TChain`, `TAccount`, [`BundlerRpcSchema`](../type-aliases/BundlerRpcSchema.md)\>

• **args**

• **args\.userOperation**: [`UserOperationStruct`](../type-aliases/UserOperationStruct.md)

• **stateOverrides?**: [`StateOverrides`](../type-aliases/StateOverrides.md)

## Returns

`Promise`\<`Object`\>

> ### callGasLimit
>
> > **callGasLimit**: `string`
>
> ### maxFeePerGas
>
> > **maxFeePerGas**: `string`
>
> ### maxPriorityFeePerGas
>
> > **maxPriorityFeePerGas**: `string`
>
> ### preVerificationGas
>
> > **preVerificationGas**: `string`
>
> ### verificationGasLimit
>
> > **verificationGasLimit**: `string`
>

## Source

[bundler/actions/estimateUserOperationGas.ts:13](https://github.com/bcnmy/sdk/blob/main/src/bundler/actions/estimateUserOperationGas.ts#L13)
