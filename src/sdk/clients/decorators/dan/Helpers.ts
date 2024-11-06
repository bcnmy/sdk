import type {
  IBrowserWallet,
  TypedData
} from "@silencelaboratories/walletprovider-sdk"
import { http, type Chain, type WalletClient, createWalletClient } from "viem"
import type { LocalAccount } from "viem/accounts"

/**
 * Implementation of IBrowserWallet for DAN (Distributed Account Network).
 * Provides wallet functionality using viem's WalletClient.
 */
export class DanWallet implements IBrowserWallet {
  walletClient: WalletClient

  /**
   * Creates a new DanWallet instance.
   *
   * @param account - The local account to use for transactions
   * @param chain - The blockchain chain configuration
   */
  constructor(account: LocalAccount, chain: Chain) {
    this.walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })
  }

  /**
   * Signs typed data according to EIP-712.
   *
   * @param _ - Unused parameter (kept for interface compatibility)
   * @param request - The typed data to sign
   * @returns A promise resolving to the signature
   */
  async signTypedData<T>(_: string, request: TypedData<T>): Promise<unknown> {
    // @ts-ignore
    return await this.walletClient.signTypedData(request)
  }
}

/**
 * Converts a hexadecimal string to a Uint8Array.
 *
 * @param hex - The hexadecimal string to convert (must have even length)
 * @returns A Uint8Array representation of the hex string
 * @throws If the hex string has an odd number of characters
 */
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

/**
 * Generates a random UUID string of specified length.
 *
 * @param length - The desired length of the UUID (default: 24)
 * @returns A random string of the specified length
 */
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
