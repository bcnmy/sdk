**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / observe

# Function: observe()

> **observe**\<`TCallbacks`\>(`observerId`, `callbacks`, `fn`): () => `void`

## Type parameters

• **TCallbacks** extends [`Callbacks`](../type-aliases/Callbacks.md)

## Parameters

• **observerId**: `string`

• **callbacks**: `TCallbacks`

• **fn**: [`EmitFunction`](../type-aliases/EmitFunction.md)\<`TCallbacks`\>

## Returns

`Function`

> ### Returns
>
> `void`
>

## Description

Sets up an observer for a given function. If another function
is set up under the same observer id, the function will only be called once
for both instances of the observer.

## Source

[bundler/utils/helpers.ts:49](https://github.com/bcnmy/sdk/blob/main/src/bundler/utils/helpers.ts#L49)
