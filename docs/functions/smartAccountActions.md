**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / smartAccountActions

# Function: smartAccountActions()

> **smartAccountActions**(`__namedParameters`): \<`TTransport`, `TChain`, `TSmartAccount`\>(`client`) => [`SmartAccountActions`](../type-aliases/SmartAccountActions.md)\<`TChain`, `TSmartAccount`\>

## Parameters

• **\_\_namedParameters**: [`Middleware`](../type-aliases/Middleware.md)

## Returns

`Function`

> ### Type parameters
>
> • **TTransport** extends `Transport`
>
> • **TChain** extends `undefined` \| `Chain` = `undefined` \| `Chain`
>
> • **TSmartAccount** extends `undefined` \| [`SmartAccount`](../type-aliases/SmartAccount.md) = `undefined` \| [`SmartAccount`](../type-aliases/SmartAccount.md)
>
> ### Parameters
>
> • **client**: `Client`\<`TTransport`, `TChain`, `TSmartAccount`\>
>
> ### Returns
>
> [`SmartAccountActions`](../type-aliases/SmartAccountActions.md)\<`TChain`, `TSmartAccount`\>
>

## Source

[client/decorators/smartAccount.ts:429](https://github.com/bcnmy/sdk/blob/main/src/client/decorators/smartAccount.ts#L429)
