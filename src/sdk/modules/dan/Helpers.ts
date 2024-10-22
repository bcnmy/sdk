import type {
  IBrowserWallet,
  TypedData
} from "@silencelaboratories/walletprovider-sdk"
import type { LocalAccount } from "viem/accounts"

export class DanWallet implements IBrowserWallet {
  account: LocalAccount

  constructor(account: LocalAccount) {
    this.account = account
  }

  async signTypedData<T>(_: string, request: TypedData<T>): Promise<unknown> {
    // @ts-ignore
    return await this.account.signTypedData(request)
  }
}

export const hexToUint8Array = (hex: string) => {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have an even number of characters")
  }
  const array = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    array[i / 2] = Number.parseInt(hex.substr(i, 2), 16)
  }
  return array
}
