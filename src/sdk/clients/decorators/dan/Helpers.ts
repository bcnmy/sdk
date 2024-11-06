import type {
  IBrowserWallet,
  TypedData
} from "@silencelaboratories/walletprovider-sdk"
import { http, type Chain, type WalletClient, createWalletClient } from "viem"
import type { LocalAccount } from "viem/accounts"

export class DanWallet implements IBrowserWallet {
  walletClient: WalletClient

  constructor(account: LocalAccount, chain: Chain) {
    this.walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })
  }

  async signTypedData<T>(_: string, request: TypedData<T>): Promise<unknown> {
    // @ts-ignore
    return await this.walletClient.signTypedData(request)
  }
}

export const hexToUint8Array = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have an even number of characters")
  }
  const array = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    array[i / 2] = Number.parseInt(hex.substr(i, 2), 16)
  }
  return array
}

export const uuid = (length = 24) => {
  let result = ""
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const charactersLength = characters.length
  let counter = 0
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}

export const stringifyBigInt = (value: bigint): string =>
  `${value.toString().slice(0, -1)}`
