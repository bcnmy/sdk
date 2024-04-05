**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / SignerToBiconomySmartAccountParameters

# Type alias: SignerToBiconomySmartAccountParameters\<TSource, TAddress\>

> **SignerToBiconomySmartAccountParameters**\<`TSource`, `TAddress`\>: `Prettify`\<`Object`\>

## Type declaration

### accountLogicAddress?

> **`optional`** **accountLogicAddress**: `Address`

### activeValidationModule?

> **`optional`** **activeValidationModule**: [`BaseValidationModule`](BaseValidationModule.md)

### address?

> **`optional`** **address**: `Address`

### defaultValidationModule?

> **`optional`** **defaultValidationModule**: [`BaseValidationModule`](BaseValidationModule.md)

### factoryAddress?

> **`optional`** **factoryAddress**: `Address`

### fallbackHandlerAddress?

> **`optional`** **fallbackHandlerAddress**: `Address`

### index?

> **`optional`** **index**: `bigint`

### signer

> **signer**: [`SmartAccountSigner`](SmartAccountSigner.md)\<`TSource`, `TAddress`\>

## Type parameters

• **TSource** extends `string` = `string`

• **TAddress** extends `Address` = `Address`

## Source

[accounts/biconomyV2/signerToSmartAccount.ts:191](https://github.com/bcnmy/sdk/blob/main/src/accounts/biconomyV2/signerToSmartAccount.ts#L191)
