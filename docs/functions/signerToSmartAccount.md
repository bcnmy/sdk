**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / signerToSmartAccount

# Function: signerToSmartAccount()

> **signerToSmartAccount**\<`TTransport`, `TChain`, `TSource`, `TAddress`\>(`client`, `__namedParameters`): `Promise`\<[`BiconomySmartAccount`](../type-aliases/BiconomySmartAccount.md)\<`TTransport`, `TChain`\>\>

## Type parameters

• **TTransport** extends `Transport` = `Transport`

• **TChain** extends `undefined` \| `Chain` = `undefined` \| `Chain`

• **TSource** extends `string` = `string`

• **TAddress** extends ```0x${string}``` = ```0x${string}```

## Parameters

• **client**: `Client`\<`TTransport`, `TChain`, `undefined`\>

• **\_\_namedParameters**

• **\_\_namedParameters\.accountLogicAddress?**: ```0x${string}```= `BICONOMY_ADDRESSES.ACCOUNT_V2_0_LOGIC`

• **\_\_namedParameters\.activeValidationModule?**: [`BaseValidationModule`](../type-aliases/BaseValidationModule.md)

• **\_\_namedParameters\.address?**: ```0x${string}```

• **\_\_namedParameters\.defaultValidationModule?**: [`BaseValidationModule`](../type-aliases/BaseValidationModule.md)

• **\_\_namedParameters\.factoryAddress?**: ```0x${string}```= `BICONOMY_ADDRESSES.FACTORY_ADDRESS`

• **\_\_namedParameters\.fallbackHandlerAddress?**: ```0x${string}```= `BICONOMY_ADDRESSES.DEFAULT_FALLBACK_HANDLER_ADDRESS`

• **\_\_namedParameters\.index?**: `bigint`= `undefined`

• **\_\_namedParameters\.signer**: [`SmartAccountSigner`](../type-aliases/SmartAccountSigner.md)\<`TSource`, `TAddress`\>

## Returns

`Promise`\<[`BiconomySmartAccount`](../type-aliases/BiconomySmartAccount.md)\<`TTransport`, `TChain`\>\>

## Source

[accounts/biconomyV2/signerToSmartAccount.ts:205](https://github.com/bcnmy/sdk/blob/main/src/accounts/biconomyV2/signerToSmartAccount.ts#L205)
