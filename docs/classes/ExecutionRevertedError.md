**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / ExecutionRevertedError

# Class: ExecutionRevertedError

## Extends

- `BaseError`

## Constructors

### new ExecutionRevertedError(__namedParameters)

> **new ExecutionRevertedError**(`__namedParameters`): [`ExecutionRevertedError`](ExecutionRevertedError.md)

#### Parameters

• **\_\_namedParameters**= `{}`

• **\_\_namedParameters\.cause?**: `BaseError`

• **\_\_namedParameters\.message?**: `string`

#### Returns

[`ExecutionRevertedError`](ExecutionRevertedError.md)

#### Overrides

`BaseError.constructor`

#### Source

[errors/models/ExecutionRevertedError.ts:13](https://github.com/bcnmy/sdk/blob/main/src/errors/models/ExecutionRevertedError.ts#L13)

## Properties

### cause?

> **`optional`** **cause**: `unknown`

#### Inherited from

`BaseError.cause`

#### Source

../node\_modules/typescript/lib/lib.es2022.error.d.ts:24

***

### details

> **details**: `string`

#### Inherited from

`BaseError.details`

#### Source

../node\_modules/viem/\_types/errors/base.d.ts:16

***

### docsPath?

> **`optional`** **docsPath**: `string`

#### Inherited from

`BaseError.docsPath`

#### Source

../node\_modules/viem/\_types/errors/base.d.ts:17

***

### message

> **message**: `string`

#### Inherited from

`BaseError.message`

#### Source

../node\_modules/typescript/lib/lib.es5.d.ts:1077

***

### metaMessages?

> **`optional`** **metaMessages**: `string`[]

#### Inherited from

`BaseError.metaMessages`

#### Source

../node\_modules/viem/\_types/errors/base.d.ts:18

***

### name

> **name**: `string` = `"ExecutionRevertedError"`

#### Overrides

`BaseError.name`

#### Source

[errors/models/ExecutionRevertedError.ts:11](https://github.com/bcnmy/sdk/blob/main/src/errors/models/ExecutionRevertedError.ts#L11)

***

### shortMessage

> **shortMessage**: `string`

#### Inherited from

`BaseError.shortMessage`

#### Source

../node\_modules/viem/\_types/errors/base.d.ts:19

***

### stack?

> **`optional`** **stack**: `string`

#### Inherited from

`BaseError.stack`

#### Source

../node\_modules/typescript/lib/lib.es5.d.ts:1078

***

### version

> **version**: `string`

#### Inherited from

`BaseError.version`

#### Source

../node\_modules/viem/\_types/errors/base.d.ts:21

***

### code

> **`static`** **code**: `number` = `3`

#### Source

[errors/models/ExecutionRevertedError.ts:8](https://github.com/bcnmy/sdk/blob/main/src/errors/models/ExecutionRevertedError.ts#L8)

***

### nodeMessage

> **`static`** **nodeMessage**: `RegExp`

#### Source

[errors/models/ExecutionRevertedError.ts:9](https://github.com/bcnmy/sdk/blob/main/src/errors/models/ExecutionRevertedError.ts#L9)

***

### prepareStackTrace()?

> **`static`** **`optional`** **prepareStackTrace**: (`err`, `stackTraces`) => `any`

Optional override for formatting stack traces

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Parameters

• **err**: `Error`

• **stackTraces**: `CallSite`[]

#### Returns

`any`

#### Inherited from

`BaseError.prepareStackTrace`

#### Source

../node\_modules/@types/node/globals.d.ts:28

***

### stackTraceLimit

> **`static`** **stackTraceLimit**: `number`

#### Inherited from

`BaseError.stackTraceLimit`

#### Source

../node\_modules/@types/node/globals.d.ts:30

## Methods

### walk()

#### walk()

> **walk**(): `Error`

##### Returns

`Error`

##### Inherited from

`BaseError.walk`

##### Source

../node\_modules/viem/\_types/errors/base.d.ts:23

#### walk(fn)

> **walk**(`fn`): `null` \| `Error`

##### Parameters

• **fn**

##### Returns

`null` \| `Error`

##### Inherited from

`BaseError.walk`

##### Source

../node\_modules/viem/\_types/errors/base.d.ts:24

***

### captureStackTrace()

#### captureStackTrace(targetObject, constructorOpt)

> **`static`** **captureStackTrace**(`targetObject`, `constructorOpt`?): `void`

Create .stack property on a target object

##### Parameters

• **targetObject**: `object`

• **constructorOpt?**: `Function`

##### Returns

`void`

##### Inherited from

`BaseError.captureStackTrace`

##### Source

../node\_modules/@types/node/globals.d.ts:21

#### captureStackTrace(targetObject, constructorOpt)

> **`static`** **captureStackTrace**(`targetObject`, `constructorOpt`?): `void`

Create .stack property on a target object

##### Parameters

• **targetObject**: `object`

• **constructorOpt?**: `Function`

##### Returns

`void`

##### Inherited from

`BaseError.captureStackTrace`

##### Source

../node\_modules/bun-types/globals.d.ts:1525
