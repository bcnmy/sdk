**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / SendUserOperationParameters

# Type alias: SendUserOperationParameters\<TAccount\>

> **SendUserOperationParameters**\<`TAccount`\>: `Object` & [`GetAccountParameter`](GetAccountParameter.md)\<`TAccount`\> & [`Middleware`](Middleware.md)

## Type declaration

### userOperation

> **userOperation**: `PartialBy`\<[`UserOperationStruct`](UserOperationStruct.md), `"sender"` \| `"nonce"` \| `"initCode"` \| `"callGasLimit"` \| `"verificationGasLimit"` \| `"preVerificationGas"` \| `"maxFeePerGas"` \| `"maxPriorityFeePerGas"` \| `"paymasterAndData"` \| `"signature"`\>

## Type parameters

• **TAccount** extends [`SmartAccount`](SmartAccount.md) \| `undefined` = [`SmartAccount`](SmartAccount.md) \| `undefined`

## Source

[accounts/actions/sendUserOperation.ts:13](https://github.com/bcnmy/sdk/blob/main/src/accounts/actions/sendUserOperation.ts#L13)
