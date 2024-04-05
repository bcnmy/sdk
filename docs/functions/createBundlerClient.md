**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / createBundlerClient

# Function: createBundlerClient()

> **createBundlerClient**\<`transport`, `chain`\>(`parameters`): `Object`

Creates a EIP-4337 compliant Bundler Client with a given [Transport](https://viem.sh/docs/clients/intro.html) configured for a [Chain](https://viem.sh/docs/clients/chains.html).

A Bundler Client is an interface to "erc 4337" [JSON-RPC API](https://eips.ethereum.org/EIPS/eip-4337#rpc-methods-eth-namespace) methods such as sending user operation, estimating gas for a user operation, get user operation receipt, etc through Bundler Actions.

## Type parameters

• **transport** extends `Transport`

• **chain** extends `undefined` \| `Chain` = `undefined`

## Parameters

• **parameters**

• **parameters\.batch?**

Flags for batch settings.

• **parameters\.batch\.multicall?**: `boolean` \| `Object`

Toggle to enable `eth_call` multicall aggregation.

• **parameters\.cacheTime?**: `number`

Time (in ms) that cached data will remain in memory.

**Default**
```ts
4_000
```

• **parameters\.chain?**: `Chain` \| `chain`

Chain for the client.

• **parameters\.key?**: `string`

A key for the client.

• **parameters\.name?**: `string`

A name for the client.

• **parameters\.pollingInterval?**: `number`

Frequency (in ms) for polling enabled actions & events.

**Default**
```ts
4_000
```

• **parameters\.transport**: `transport`

The RPC transport

## Returns

`Object`

A Bundler Client. [BundlerClient](../type-aliases/BundlerClient.md)

### account

> **account**: `undefined` \| `Account`

The Account of the Client.

### batch?

> **`optional`** **batch**: `Object`

Flags for batch settings.

### batch.multicall?

> **`optional`** **multicall**: `boolean` \| `Object`

Toggle to enable `eth_call` multicall aggregation.

### cacheTime

> **cacheTime**: `number`

Time (in ms) that cached data will remain in memory.

### chain

> **chain**: `undefined` \| `Chain`

Chain for the client.

### chainId()

> **chainId**: () => `Promise`\<`number`\>

Returns the supported chain id by the bundler service

- Docs: https://docs.biconomy.io/... // TODO

#### Example

```ts
import { createClient } from "viem"
import { bundlerActions } from "@biconomy/sdk" // TODO

const bundlerClient = createClient({
     chain: goerli,
     transport: http(BUNDLER_URL)
}).extend(bundlerActions)

const chainId = await bundlerClient.chainId()
// Return 5n for Goerli
```

#### Returns

`Promise`\<`number`\>

### estimateUserOperationGas()

> **estimateUserOperationGas**: (`args`, `stateOverrides`?) => `Promise`\<`Object`\>

Estimates preVerificationGas, verificationGasLimit and callGasLimit for user operation

- Docs: https://docs.biconomy.io/... // TODO

#### Example

```ts
import { createClient } from "viem"
import { bundlerActions } from "@biconomy/sdk" // TODO

const bundlerClient = createClient({
     chain: goerli,
     transport: http(BUNDLER_URL)
}).extend(bundlerActions)

const gasParameters = await bundlerClient.estimateUserOperationGas({
    userOperation: signedUserOperation,
   entryPoint: entryPoint
})

// Return {preVerificationGas: 43492n, verificationGasLimit: 59436n, callGasLimit: 9000n}
```

#### Parameters

• **args**

[EstimateUserOperationGasParameters](../type-aliases/EstimateUserOperationGasParameters.md)

• **args\.userOperation**: [`UserOperationStruct`](../type-aliases/UserOperationStruct.md)

• **stateOverrides?**: [`StateOverrides`](../type-aliases/StateOverrides.md)

#### Returns

`Promise`\<`Object`\>

> ##### callGasLimit
>
> > **callGasLimit**: `string`
>
> ##### maxFeePerGas
>
> > **maxFeePerGas**: `string`
>
> ##### maxPriorityFeePerGas
>
> > **maxPriorityFeePerGas**: `string`
>
> ##### preVerificationGas
>
> > **preVerificationGas**: `string`
>
> ##### verificationGasLimit
>
> > **verificationGasLimit**: `string`
>

### extend()

> **extend**: \<`client`\>(`fn`) => `Client`\<`Transport`, `undefined` \| `Chain`, `undefined` \| `Account`, [`BundlerRpcSchema`](../type-aliases/BundlerRpcSchema.md), `{ [K in string | number | symbol]: client[K] }` & [`BundlerActions`](../type-aliases/BundlerActions.md)\>

#### Type parameters

• **client** extends `Object` & `Partial`\<`ExtendableProtectedActions`\<`Transport`, `undefined` \| `Chain`, `undefined` \| `Account`\>\>

#### Parameters

• **fn**

#### Returns

`Client`\<`Transport`, `undefined` \| `Chain`, `undefined` \| `Account`, [`BundlerRpcSchema`](../type-aliases/BundlerRpcSchema.md), `{ [K in string | number | symbol]: client[K] }` & [`BundlerActions`](../type-aliases/BundlerActions.md)\>

### getGasFeeValues()

> **getGasFeeValues**: () => `Promise`\<[`GasFeeValues`](../type-aliases/GasFeeValues.md)\>

#### Returns

`Promise`\<[`GasFeeValues`](../type-aliases/GasFeeValues.md)\>

### getUserOpStatus()

> **getUserOpStatus**: (`userOpHash`) => `Promise`\<[`UserOpStatus`](../type-aliases/UserOpStatus.md)\>

#### Parameters

• **userOpHash**: ```0x${string}```

#### Returns

`Promise`\<[`UserOpStatus`](../type-aliases/UserOpStatus.md)\>

### getUserOperationByHash()

> **getUserOperationByHash**: (`args`) => `Promise`\<`null` \| `Object`\>

Returns the user operation from userOpHash

- Docs: https://docs.biconomy.io/... // TODO

#### Example

```ts
import { createClient } from "viem"
import { bundlerActions } from "@biconomy/sdk" // TODO

const bundlerClient = createClient({
     chain: goerli,
     transport: http(BUNDLER_URL)
}).extend(bundlerActions)

await bundlerClient.getUserOperationByHash(userOpHash)
```

#### Parameters

• **args**

UserOpHash that was returned by [sendUserOperation](sendUserOperationWithBundler.md)

• **args\.hash**: ```0x${string}```

#### Returns

`Promise`\<`null` \| `Object`\>

### getUserOperationReceipt()

> **getUserOperationReceipt**: (`args`) => `Promise`\<`null` \| `Object`\>

Returns the user operation receipt from userOpHash

- Docs: https://docs.biconomy.io/... // TODO

#### Example

```ts
import { createClient } from "viem"
import { bundlerActions } from "@biconomy/sdk" // TODO

const bundlerClient = createClient({
     chain: goerli,
     transport: http(BUNDLER_URL)
}).extend(bundlerActions)

await bundlerClient.getUserOperationReceipt({hash: userOpHash})
```

#### Parameters

• **args**

[GetUserOperationReceiptParameters](../type-aliases/GetUserOperationReceiptParameters.md) UserOpHash that was returned by [sendUserOperation](sendUserOperationWithBundler.md)

• **args\.hash**: ```0x${string}```

#### Returns

`Promise`\<`null` \| `Object`\>

### key

> **key**: `string`

A key for the client.

### name

> **name**: `string`

A name for the client.

### pollingInterval

> **pollingInterval**: `number`

Frequency (in ms) for polling enabled actions & events. Defaults to 4_000 milliseconds.

### request

> **request**: `EIP1193RequestFn`\<[`BundlerRpcSchema`](../type-aliases/BundlerRpcSchema.md)\>

Request function wrapped with friendly error handling

### sendUserOperation()

> **sendUserOperation**: (`args`) => `Promise`\<```0x${string}```\>

Sends user operation to the bundler

- Docs: https://docs.biconomy.io/... // TODO

#### Example

```ts
import { createClient } from "viem"
import { bundlerActions } from "@biconomy/sdk" // TODO

const bundlerClient = createClient({
     chain: goerli,
     transport: http(bundlerUrl)
}).extend(bundlerActions)

const userOpHash = await bundlerClient.sendUserOperation({
     userOperation: signedUserOperation
})

Return "0x...hash"
```

#### Parameters

• **args**

[SendUserOperationParameters](../type-aliases/SendUserOperationParameters.md).

• **args\.account?**: [`SmartAccount`](../type-aliases/SmartAccount.md)\<`string`, `Transport`, `undefined` \| `Chain`, `Abi`\>

• **args\.middleware?**: `Object` \| (`args`) => `Promise`\<[`UserOperationStruct`](../type-aliases/UserOperationStruct.md)\>

• **args\.userOperation**: `PartialBy`\<[`UserOperationStruct`](../type-aliases/UserOperationStruct.md), `"callGasLimit"` \| `"preVerificationGas"` \| `"verificationGasLimit"` \| `"sender"` \| `"nonce"` \| `"initCode"` \| `"maxFeePerGas"` \| `"maxPriorityFeePerGas"` \| `"paymasterAndData"` \| `"signature"`\>

#### Returns

`Promise`\<```0x${string}```\>

### supportedEntryPoints()

> **supportedEntryPoints**: () => `"0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"`

Returns the supported entrypoints by the bundler service

- Docs: https://docs.biconomy.io/... // TODO

#### Example

```ts
import { createClient } from "viem"
import { bundlerActions } from "@biconomy/sdk" // TODO

const bundlerClient = createClient({
     chain: goerli,
     transport: http(BUNDLER_URL)
}).extend(bundlerActions)

const supportedEntryPoints = await bundlerClient.supportedEntryPoints()

// Return ['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']
```

#### Returns

`"0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"`

### transport

> **transport**: `TransportConfig`\<`string`, `EIP1193RequestFn`\> & `Record`\<`string`, `any`\>

The RPC transport

### type

> **type**: `string`

The type of client.

### uid

> **uid**: `string`

A unique ID for the client.

### waitForUserOperationReceipt()

> **waitForUserOperationReceipt**: (`args`) => `Promise`\<`Object`\>

Waits for the User Operation to be included on a [Block](https://viem.sh/docs/glossary/terms.html#block) (one confirmation), and then returns the [User Operation Receipt]

- Docs: https://docs.biconomy.io/... // TODO

#### Example

```ts
import { waitForUserOperationReceipt, http } from 'viem'
import { createBundlerClient } from "@biconomy/sdk" // TODO
import { mainnet } from 'viem/chains'

const bundlerClient = createBundlerClient({
  chain: mainnet,
  transport: http(bundlerUrl),
})
const userOperationReceipt = await bundlerClient.waitForUserOperationReceipt({
  hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
})
```

#### Parameters

• **args**

• **args\.hash**: ```0x${string}```

The hash of the transaction.

• **args\.pollingInterval?**: `number`

Polling frequency (in ms). Defaults to the client's pollingInterval config.

**Default**
```ts
client.pollingInterval
```

• **args\.timeout?**: `number`

Optional timeout (in milliseconds) to wait before stopping polling.

#### Returns

`Promise`\<`Object`\>

> ##### actualGasCost
>
> > **actualGasCost**: ```0x${string}```
>
> ##### actualGasUsed
>
> > **actualGasUsed**: ```0x${string}```
>
> ##### entryPoint
>
> > **entryPoint**: `string`
>
> ##### logs
>
> > **logs**: `any`[]
>
> ##### paymaster
>
> > **paymaster**: `string`
>
> ##### reason
>
> > **reason**: `string`
>
> ##### receipt
>
> > **receipt**: `any`
>
> ##### success
>
> > **success**: `"false"` \| `"true"`
>
> ##### userOpHash
>
> > **userOpHash**: `string`
>

## Example

```ts
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const bundlerClient = createBundlerClient({
  chain: mainnet,
  transport: http(BUNDLER_URL),
})
```

## Source

[bundler/createBundlerClient.ts:43](https://github.com/bcnmy/sdk/blob/main/src/bundler/createBundlerClient.ts#L43)
