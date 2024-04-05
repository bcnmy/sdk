**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / SmartAccount

# Type alias: SmartAccount\<Name, transport, chain, TAbi\>

> **SmartAccount**\<`Name`, `transport`, `chain`, `TAbi`\>: `LocalAccount`\<`Name`\> & `Object`

Represents a smart account.

## Template

The type of the entry point address.

## Type declaration

### client

> **client**: `Client`\<`transport`, `chain`\>

The client associated with the smart account.

### defaultValidationModule

> **defaultValidationModule**: [`BaseValidationModule`](BaseValidationModule.md)

The default validation module of the smart account.

### encodeCallData()

> **encodeCallData**: (`args`) => `Promise`\<`Hex`\>

Encodes the call data for a transaction.

#### Parameters

• **args**: [`Transaction`](Transaction.md) \| [`Transaction`](Transaction.md)[]

The Transaction arguments.

#### Returns

`Promise`\<`Hex`\>

### encodeDeployCallData()

> **encodeDeployCallData**: (`{
    abi,
    args,
    bytecode
  }`) => `Promise`\<`Hex`\>

Encodes the deploy call data for a smart contract.

#### Parameters

• **\{
    abi,
    args,
    bytecode
  }**: `EncodeDeployDataParameters`\<`TAbi`\>

#### Returns

`Promise`\<`Hex`\>

### entryPoint

> **entryPoint**: [`ENTRYPOINT_ADDRESS_V06_TYPE`](ENTRYPOINT_ADDRESS_V06_TYPE.md)

The entry point address of the smart account.

### getFactory()

> **getFactory**: () => `Promise`\<`Address` \| `undefined`\>

Retrieves the factory address of the smart account.

#### Returns

`Promise`\<`Address` \| `undefined`\>

### getFactoryData()

> **getFactoryData**: () => `Promise`\<`Hex` \| `undefined`\>

Retrieves the factory data of the smart account.

#### Returns

`Promise`\<`Hex` \| `undefined`\>

### getInitCode()

> **getInitCode**: () => `Promise`\<`Hex`\>

Retrieves the initialization code of the smart account.

#### Returns

`Promise`\<`Hex`\>

### getNonce()

> **getNonce**: () => `Promise`\<`bigint`\>

Retrieves the nonce of the smart account.

#### Returns

`Promise`\<`bigint`\>

### signUserOperation()

> **signUserOperation**: (`userOperation`) => `Promise`\<`Hex`\>

Signs a user operation.

#### Parameters

• **userOperation**: [`UserOperationStruct`](UserOperationStruct.md)

The user operation to sign.

#### Returns

`Promise`\<`Hex`\>

### getDummySignature()

Retrieves the dummy signature for a user operation.

#### Parameters

• **userOperation**: [`UserOperationStruct`](UserOperationStruct.md)

The user operation.

#### Returns

`Promise`\<```0x${string}```\>

A promise that resolves to the dummy signature as a Hex string.

## Type parameters

• **Name** extends `string` = `string`

The type of the account name.

• **transport** extends `Transport` = `Transport`

The type of the transport.

• **chain** extends `Chain` \| `undefined` = `Chain` \| `undefined`

The type of the chain.

• **TAbi** extends `Abi` \| readonly `unknown`[] = `Abi`

The type of the ABI.

## Source

[accounts/utils/types.ts:78](https://github.com/bcnmy/sdk/blob/main/src/accounts/utils/types.ts#L78)
