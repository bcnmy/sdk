**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / createECDSAOwnershipModule

# Function: createECDSAOwnershipModule()

> **createECDSAOwnershipModule**(`moduleConfig`): `Promise`\<`Object`\>

Creates an ECDSA Ownership Module.

## Parameters

• **moduleConfig**: [`ECDSAOwnershipValidationModuleConfig`](../type-aliases/ECDSAOwnershipValidationModuleConfig.md)

The configuration for the module.

## Returns

`Promise`\<`Object`\>

A promise that resolves to a BaseValidationModule.

> ### entryPointAddress
>
> > **entryPointAddress**: ```0x${string}```
>
> The entry point address.
>
> ### getDummySignature()
>
> #### getDummySignature()
>
> ##### Returns
>
> `Promise`\<```0x${string}```\>
>
> #### getDummySignature(_params)
>
> Retrieves a dummy signature.
>
> ##### Parameters
>
> • **\_params?**: [`ModuleInfo`](../type-aliases/ModuleInfo.md)
>
> The module information.
>
> ##### Returns
>
> `Promise`\<```0x${string}```\>
>
> A promise that resolves to the dummy signature.
>
> ### getInitData()
>
> #### Returns
>
> `Promise`\<```0x${string}```\>
>
> ### getModuleAddress()
>
> #### Returns
>
> ```0x${string}```
>
> ### getSigner()
>
> #### Returns
>
> `Promise`\<[`SmartAccountSigner`](../type-aliases/SmartAccountSigner.md)\>
>
> ### signMessage()
>
> #### Parameters
>
> • **\_message**: `string` \| `Uint8Array`
>
> #### Returns
>
> `Promise`\<`string`\>
>
> ### signMessageSmartAccountSigner()
>
> Signs a message using a smart account signer.
>
> #### Parameters
>
> • **message**: `string` \| `Uint8Array`
>
> The message to sign.
>
> • **signer**: `LocalAccount`
>
> The local account signer.
>
> #### Returns
>
> `Promise`\<`string`\>
>
> A promise that resolves to the signature.
>
> ### signUserOpHash()
>
> #### signUserOpHash(_userOpHash)
>
> ##### Parameters
>
> • **\_userOpHash**: `string`
>
> ##### Returns
>
> `Promise`\<```0x${string}```\>
>
> #### signUserOpHash(_userOpHash, _params)
>
> Signs a user operation hash.
>
> ##### Parameters
>
> • **\_userOpHash**: `string`
>
> The user operation hash.
>
> • **\_params?**: [`ModuleInfo`](../type-aliases/ModuleInfo.md)
>
> The module information.
>
> ##### Returns
>
> `Promise`\<```0x${string}```\>
>
> A promise that resolves to the signature.
>

## Source

[modules/ecdsaOwnershipValidationModule/createECDSAOwnershipModule.ts:20](https://github.com/bcnmy/sdk/blob/main/src/modules/ecdsaOwnershipValidationModule/createECDSAOwnershipModule.ts#L20)
