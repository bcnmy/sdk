**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / PrepareUserOperationRequestParameters

# Type alias: PrepareUserOperationRequestParameters\<TAccount\>

> **PrepareUserOperationRequestParameters**\<`TAccount`\>: `Object` & [`GetAccountParameter`](GetAccountParameter.md)\<`TAccount`\> & [`Middleware`](Middleware.md)

## Type declaration

### userOperation

> **userOperation**: `PartialBy`\<[`UserOperationStruct`](UserOperationStruct.md), `"sender"` \| `"nonce"` \| `"initCode"` \| `"callGasLimit"` \| `"verificationGasLimit"` \| `"preVerificationGas"` \| `"maxFeePerGas"` \| `"maxPriorityFeePerGas"` \| `"paymasterAndData"` \| `"signature"`\>

## Type parameters

• **TAccount** extends [`SmartAccount`](SmartAccount.md) \| `undefined` = [`SmartAccount`](SmartAccount.md) \| `undefined`

## Source

[accounts/utils/types.ts:196](https://github.com/bcnmy/sdk/blob/main/src/accounts/utils/types.ts#L196)
