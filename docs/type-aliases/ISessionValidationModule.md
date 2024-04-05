**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / ISessionValidationModule

# Type alias: ISessionValidationModule\<T\>

> **ISessionValidationModule**\<`T`\>: `Object`

Interface for implementing a Session Validation Module.
Session Validation Modules works along with SessionKeyManager
and generate module specific sessionKeyData which is to be
verified by SessionValidationModule on chain.

## Remarks

sessionData is of generic type T which is specific to the module

## Author

Sachin Tomar `<sachin.tomar@biconomy.io>`

## Type parameters

• **T**

## Type declaration

### getAddress()

#### Returns

`string`

### getSessionKeyData()

#### Parameters

• **\_sessionData**: `T`

#### Returns

`Promise`\<`string`\>

## Source

[modules/utils/types.ts:96](https://github.com/bcnmy/sdk/blob/main/src/modules/utils/types.ts#L96)
