**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / PaymasterClientActions

# Type alias: PaymasterClientActions

> **PaymasterClientActions**: `Object`

## Type declaration

### getPaymasterFeeQuotesOrData()

> **getPaymasterFeeQuotesOrData**: (`args`) => `Promise`\<[`FeeQuotesOrDataERC20Response`](FeeQuotesOrDataERC20Response.md) \| [`FeeQuotesOrDataSponsoredResponse`](FeeQuotesOrDataSponsoredResponse.md)\>

#### Parameters

• **args**: [`FeeQuoteOrDataParameters`](FeeQuoteOrDataParameters.md)

#### Returns

`Promise`\<[`FeeQuotesOrDataERC20Response`](FeeQuotesOrDataERC20Response.md) \| [`FeeQuotesOrDataSponsoredResponse`](FeeQuotesOrDataSponsoredResponse.md)\>

### sponsorUserOperation()

> **sponsorUserOperation**: (`args`) => `Promise`\<[`SponsorUserOperationReturnType`](SponsorUserOperationReturnType.md)\>

Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.

#### Example

```ts
import { createClient } from "viem"
import { paymasterActions } from "@biconomy/sdk" // TODO

const bundlerClient = createClient({
     chain: goerli,
     transport: http(paymasterUrl)
}).extend(paymasterActions)

await bundlerClient.sponsorUserOperation(bundlerClient, {
     userOperation: userOperationWithDummySignature,
     entryPoint: entryPoint
}})
```

#### Parameters

• **args**: [`SponsorUserOperationParameters`](SponsorUserOperationParameters.md)

[SponsorUserOperationParameters](SponsorUserOperationParameters.md) UserOperation you want to sponsor & entryPoint.

#### Returns

`Promise`\<[`SponsorUserOperationReturnType`](SponsorUserOperationReturnType.md)\>

## Source

[client/decorators/paymaster.ts:13](https://github.com/bcnmy/sdk/blob/main/src/client/decorators/paymaster.ts#L13)
