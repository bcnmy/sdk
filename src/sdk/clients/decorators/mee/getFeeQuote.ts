import type { Hex } from "viem"
import type { Address } from "viem/accounts"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import type { Call } from "../../../account/utils/Types"
import type { AnyData, ModularSmartAccount } from "../../../modules/utils/Types"
import type { BaseMeeService } from "../../createMeeService"

const DEFAULT_GAS_LIMIT = 1000000n
export type GetFeeQuote = AnyData

export type MeeRpcSchema = [
  {
    Method: "mee_getFeeQuote"
    Parameters: []
    ReturnType: GetFeeQuote
  }
]

export type GetFeeQuoteParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  accounts?: TModularSmartAccount[]
  calls: Call[]
  paymentInfo: {
    token: Hex
    chainId: number
  }
}

// [callData, sender, factory, factoryData, callGasLimit, nonce]
export type AccountData = [Hex, Address, Address, Hex, string, string, number]

export type WalletProvider = "BICO_V2"
export type GetFeeQuoteRequest = {
  walletProvider: WalletProvider
  userOps: AccountData[]
  paymentInfo: GetFeeQuoteParameters<ModularSmartAccount>["paymentInfo"]
}

export async function getFeeQuote(
  client: BaseMeeService,
  parameters: GetFeeQuoteParameters<ModularSmartAccount>
): Promise<GetFeeQuote> {
  const {
    accounts: accounts_ = client.accounts,
    calls,
    paymentInfo
  } = parameters

  if (!accounts_?.length) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  // Get payload data for each account
  const userOps = await Promise.all(
    accounts_.map((account) => {
      // Initiate all asynchronous operations
      const callDataPromise = account.encodeCalls(calls)
      const factoryArgsPromise = account.getFactoryArgs()
      const chainIdPromise = account?.client?.chain?.id
      const noncePromise = account.getNonce()
      const gasLimitPromise = (async () => {
        try {
          if (account?.userOperation?.estimateGas) {
            const gas = await account.userOperation.estimateGas({
              sender: account.address,
              callData: await callDataPromise, // Await callDataPromise here
              nonce: await noncePromise // Await noncePromise here
            })
            return gas?.callGasLimit ?? DEFAULT_GAS_LIMIT
          }
          return DEFAULT_GAS_LIMIT
        } catch {
          return DEFAULT_GAS_LIMIT
        }
      })()

      // Await all promises in parallel
      return Promise.all([
        callDataPromise,
        factoryArgsPromise,
        noncePromise,
        gasLimitPromise,
        chainIdPromise
      ]).then(
        ([callData, { factory, factoryData }, nonce, callGasLimit, chainId]) =>
          [
            callData,
            account.address, // sender
            factory,
            factoryData,
            String(callGasLimit),
            String(nonce),
            chainId
          ] as AccountData
      )
    })
  )

  const request: GetFeeQuoteRequest = {
    walletProvider: "BICO_V2",
    userOps,
    paymentInfo
  }

  console.log({ request })

  return await client.request({ method: "mee_getFeeQuote", params: request })
}
