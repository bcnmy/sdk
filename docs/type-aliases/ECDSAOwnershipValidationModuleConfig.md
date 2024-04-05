**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / ECDSAOwnershipValidationModuleConfig

# Type alias: ECDSAOwnershipValidationModuleConfig

> **ECDSAOwnershipValidationModuleConfig**: [`BaseValidationModuleConfig`](BaseValidationModuleConfig.md) & `Object`

## Type declaration

### entryPointAddress?

> **`optional`** **entryPointAddress**: `Address`

entryPointAddress: address of the entry point contract

### moduleAddress?

> **`optional`** **moduleAddress**: `Hex`

Address of the module

### signer

> **signer**: [`SmartAccountSigner`](SmartAccountSigner.md)

Signer: viemWallet or ethers signer. Ingested when passed into smartAccount

### version?

> **`optional`** **version**: [`ModuleVersion`](ModuleVersion.md)

Version of the module

## Source

[modules/utils/types.ts:101](https://github.com/bcnmy/sdk/blob/main/src/modules/utils/types.ts#L101)
