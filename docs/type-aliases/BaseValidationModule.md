**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / BaseValidationModule

# Type alias: BaseValidationModule

> **BaseValidationModule**: [`IValidationModule`](IValidationModule.md) & `Object`

Represents a base validation module.

## Type declaration

### entryPointAddress

> **entryPointAddress**: `Hex`

The entry point address.

### getDummySignature()

Retrieves a dummy signature.

#### Parameters

• **\_params?**: [`ModuleInfo`](ModuleInfo.md)

The module information.

#### Returns

`Promise`\<```0x${string}```\>

A promise that resolves to the dummy signature.

### getInitData()

Retrieves the initialization data.

#### Returns

`Promise`\<```0x${string}```\>

A promise that resolves to the initialization data.

### getModuleAddress()

Retrieves the module address.

#### Returns

```0x${string}```

The module address.

### getSigner()

Retrieves the signer.

#### Returns

`Promise`\<[`SmartAccountSigner`](SmartAccountSigner.md)\>

A promise that resolves to the smart account signer.

### signMessage()

Signs a message.

#### Parameters

• **\_message**: `string` \| `Uint8Array`

The message to sign.

#### Returns

`Promise`\<`string`\>

A promise that resolves to the signature.

### signMessageSmartAccountSigner()

Signs a message using a smart account signer.

#### Parameters

• **message**: `string` \| `Uint8Array`

The message to sign.

• **signer**: `LocalAccount`

The local account signer.

#### Returns

`Promise`\<`string`\>

A promise that resolves to the signature.

### signUserOpHash()

Signs a user operation hash.

#### Parameters

• **\_userOpHash**: `string`

The user operation hash.

• **\_params?**: [`ModuleInfo`](ModuleInfo.md)

The module information.

#### Returns

`Promise`\<```0x${string}```\>

A promise that resolves to the signature.

## Source

[modules/utils/types.ts:28](https://github.com/bcnmy/sdk/blob/main/src/modules/utils/types.ts#L28)
