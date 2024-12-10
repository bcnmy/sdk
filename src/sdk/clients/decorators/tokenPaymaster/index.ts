import type { Address } from "viem"
import type { PaymasterClient, UserOperation } from "viem/account-abstraction"
import {
  type TokenPaymasterQuotesResponse,
  getPaymasterQuotes
} from "./getPaymasterQuotes"

export type TokenPaymasterActions = {
  getPaymasterQuotes: (
    userOp: UserOperation,
    tokenList: Address[]
  ) => Promise<TokenPaymasterQuotesResponse>
}

export const bicoTokenPaymasterActions =
  () =>
  (client: PaymasterClient): TokenPaymasterActions => ({
    getPaymasterQuotes: async (userOp: UserOperation, tokenList: Address[]) =>
      getPaymasterQuotes(userOp, client, tokenList)
  })
