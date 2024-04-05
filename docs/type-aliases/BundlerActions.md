**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / BundlerActions

# Type alias: BundlerActions

> **BundlerActions**: `Object`

## Type declaration

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

> **estimateUserOperationGas**: (`args`, `stateOverrides`?) => `Promise`\<`Prettify`\<`Object`\>\>

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

• **args**: `Prettify`\<`Omit`\<[`EstimateUserOperationGasParameters`](EstimateUserOperationGasParameters.md), `"entryPoint"`\>\>

[EstimateUserOperationGasParameters](EstimateUserOperationGasParameters.md)

• **stateOverrides?**: [`StateOverrides`](StateOverrides.md)

#### Returns

`Promise`\<`Prettify`\<`Object`\>\>

### getGasFeeValues()

> **getGasFeeValues**: () => `Promise`\<[`GetGasFeeValuesReturnType`](GetGasFeeValuesReturnType.md)\>

#### Returns

`Promise`\<[`GetGasFeeValuesReturnType`](GetGasFeeValuesReturnType.md)\>

### getUserOpStatus()

> **getUserOpStatus**: (`userOpHash`) => `Promise`\<[`UserOpStatus`](UserOpStatus.md)\>

#### Parameters

• **userOpHash**: `Hash`

#### Returns

`Promise`\<[`UserOpStatus`](UserOpStatus.md)\>

### getUserOperationByHash()

> **getUserOperationByHash**: (`args`) => `Promise`\<`Prettify`\<[`GetUserOperationByHashReturnType`](GetUserOperationByHashReturnType.md)\> \| `null`\>

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

• **args**: `Prettify`\<[`GetUserOperationByHashParameters`](GetUserOperationByHashParameters.md)\>

UserOpHash that was returned by [sendUserOperation](../functions/sendUserOperationWithBundler.md)

#### Returns

`Promise`\<`Prettify`\<[`GetUserOperationByHashReturnType`](GetUserOperationByHashReturnType.md)\> \| `null`\>

### getUserOperationReceipt()

> **getUserOperationReceipt**: (`args`) => `Promise`\<`Prettify`\<[`UserOpReceipt`](UserOpReceipt.md)\> \| `null`\>

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

• **args**: `Prettify`\<`Object`\>

[GetUserOperationReceiptParameters](GetUserOperationReceiptParameters.md) UserOpHash that was returned by [sendUserOperation](../functions/sendUserOperationWithBundler.md)

#### Returns

`Promise`\<`Prettify`\<[`UserOpReceipt`](UserOpReceipt.md)\> \| `null`\>

### sendUserOperation()

> **sendUserOperation**: (`args`) => `Promise`\<`Hash`\>

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

• **args**: `Prettify`\<`Omit`\<[`SendUserOperationParameters`](SendUserOperationParameters.md), `"entryPoint"`\>\>

[SendUserOperationParameters](SendUserOperationParameters.md).

#### Returns

`Promise`\<`Hash`\>

### supportedEntryPoints()

> **supportedEntryPoints**: () => [`ENTRYPOINT_ADDRESS_V06_TYPE`](ENTRYPOINT_ADDRESS_V06_TYPE.md)

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

[`ENTRYPOINT_ADDRESS_V06_TYPE`](ENTRYPOINT_ADDRESS_V06_TYPE.md)

### waitForUserOperationReceipt()

> **waitForUserOperationReceipt**: (`args`) => `Promise`\<`Prettify`\<[`UserOpReceipt`](UserOpReceipt.md)\>\>

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

• **args**: `Prettify`\<[`WaitForUserOperationReceiptParameters`](WaitForUserOperationReceiptParameters.md)\>

#### Returns

`Promise`\<`Prettify`\<[`UserOpReceipt`](UserOpReceipt.md)\>\>

## Source

[client/decorators/bundler.ts:33](https://github.com/bcnmy/sdk/blob/main/src/client/decorators/bundler.ts#L33)
