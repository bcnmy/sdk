**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / IValidationModule

# Type alias: IValidationModule

> **IValidationModule**: `Object`

## Type declaration

### getDummySignature()

#### Returns

`Promise`\<```0x${string}```\>

### getInitData()

#### Returns

`Promise`\<```0x${string}```\>

### getModuleAddress()

#### Returns

```0x${string}```

### getSigner()

#### Returns

`Promise`\<[`SmartAccountSigner`](SmartAccountSigner.md)\>

### signMessage()

#### Parameters

• **\_message**: `string` \| `Uint8Array`

#### Returns

`Promise`\<`string`\>

### signUserOpHash()

#### Parameters

• **\_userOpHash**: `string`

#### Returns

`Promise`\<```0x${string}```\>

## Source

[modules/utils/types.ts:16](https://github.com/bcnmy/sdk/blob/main/src/modules/utils/types.ts#L16)
