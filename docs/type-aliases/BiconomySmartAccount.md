**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / BiconomySmartAccount

# Type alias: BiconomySmartAccount\<transport, chain\>

> **BiconomySmartAccount**\<`transport`, `chain`\>: [`SmartAccount`](SmartAccount.md)\<`"biconomySmartAccount"`, `transport`, `chain`\> & `Object`

## Type declaration

### activeValidationModule

> **activeValidationModule**: [`BaseValidationModule`](BaseValidationModule.md)

### defaultValidationModule

> **defaultValidationModule**: [`BaseValidationModule`](BaseValidationModule.md)

### setActiveValidationModule()

> **setActiveValidationModule**: (`moduleAddress`) => [`BaseValidationModule`](BaseValidationModule.md)

#### Parameters

• **moduleAddress**: [`BaseValidationModule`](BaseValidationModule.md)

#### Returns

[`BaseValidationModule`](BaseValidationModule.md)

## Type parameters

• **transport** extends `Transport` = `Transport`

• **chain** extends `Chain` \| `undefined` = `Chain` \| `undefined`

## Source

[accounts/biconomyV2/signerToSmartAccount.ts:40](https://github.com/bcnmy/sdk/blob/main/src/accounts/biconomyV2/signerToSmartAccount.ts#L40)
