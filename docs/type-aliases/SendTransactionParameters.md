**@biconomy/sdk** • [Readme](../README.md) \| [API](../globals.md)

***

[@biconomy/sdk](../README.md) / SendTransactionParameters

# Type alias: SendTransactionParameters\<TChain, TAccount, TChainOverride, derivedChain\>

> **SendTransactionParameters**\<`TChain`, `TAccount`, `TChainOverride`, `derivedChain`\>: `UnionOmit`\<`FormattedTransactionRequest`\<`derivedChain`\>, `"from"`\> & [`GetAccountParameter`](GetAccountParameter.md)\<`TAccount`\> & `GetChainParameter`\<`TChain`, `TChainOverride`\>

## Type parameters

• **TChain** extends `Chain` \| `undefined` = `Chain` \| `undefined`

• **TAccount** extends [`SmartAccount`](SmartAccount.md) \| `undefined` = [`SmartAccount`](SmartAccount.md) \| `undefined`

• **TChainOverride** extends `Chain` \| `undefined` = `Chain` \| `undefined`

• **derivedChain** extends `Chain` \| `undefined` = `DeriveChain`\<`TChain`, `TChainOverride`\>

## Source

[accounts/utils/types.ts:220](https://github.com/bcnmy/sdk/blob/main/src/accounts/utils/types.ts#L220)
