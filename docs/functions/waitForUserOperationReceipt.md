**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / waitForUserOperationReceipt

# Function: waitForUserOperationReceipt()

> **waitForUserOperationReceipt**\<`TTransport`, `TChain`, `TAccount`\>(`bundlerClient`, `parameters`): `Promise`\<`Object`\>

Waits for the User Operation to be included on a [Block](https://viem.sh/docs/glossary/terms.html#block) (one confirmation), and then returns the [User Operation Receipt].

- Docs: https://docs.biconomy.io/ ... // TODO

## Type parameters

• **TTransport** extends `Transport` = `Transport`

• **TChain** extends `undefined` \| `Chain` = `undefined` \| `Chain`

• **TAccount** extends `undefined` \| `Account` = `undefined` \| `Account`

## Parameters

• **bundlerClient**: `Client`\<`TTransport`, `TChain`, `TAccount`\>

• **parameters**

[WaitForUserOperationReceiptParameters](../type-aliases/WaitForUserOperationReceiptParameters.md)

• **parameters\.hash**: ```0x${string}```

The hash of the transaction.

• **parameters\.pollingInterval?**: `number`= `bundlerClient.pollingInterval`

Polling frequency (in ms). Defaults to the client's pollingInterval config.

**Default**
```ts
client.pollingInterval
```

• **parameters\.timeout?**: `number`

Optional timeout (in milliseconds) to wait before stopping polling.

## Returns

`Promise`\<`Object`\>

The transaction receipt. [GetUserOperationReceiptReturnType](../type-aliases/GetUserOperationReceiptReturnType.md)

> ### actualGasCost
>
> > **actualGasCost**: ```0x${string}```
>
> ### actualGasUsed
>
> > **actualGasUsed**: ```0x${string}```
>
> ### entryPoint
>
> > **entryPoint**: `string`
>
> ### logs
>
> > **logs**: `any`[]
>
> ### paymaster
>
> > **paymaster**: `string`
>
> ### reason
>
> > **reason**: `string`
>
> ### receipt
>
> > **receipt**: `any`
>
> ### success
>
> > **success**: `"false"` \| `"true"`
>
> ### userOpHash
>
> > **userOpHash**: `string`
>

## Example

```ts
import { waitForUserOperationReceipt, http } from 'viem'
import { createBundlerClient } from "@biconomy/sdk" // TODO
import { mainnet } from 'viem/chains'

const client = createBundlerClient({
  chain: mainnet,
  transport: http(),
})
const userOperationReceipt = await waitForUserOperationReceipt(client, {
  hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
})
```

## Source

[bundler/actions/waitForUserOperationReceipt.ts:60](https://github.com/bcnmy/sdk/blob/main/src/bundler/actions/waitForUserOperationReceipt.ts#L60)
