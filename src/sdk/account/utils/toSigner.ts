import {
  type Account,
  type Address,
  type Chain,
  type EIP1193Provider,
  type EIP1193RequestFn,
  type EIP1474Methods,
  type Hex,
  type LocalAccount,
  type OneOf,
  type Transport,
  type WalletClient,
  createWalletClient,
  custom,
  getAddress,
  hexToBytes
} from "viem"
import { toAccount } from "viem/accounts"

import { signTypedData } from "viem/actions"
import { getAction } from "viem/utils"
import type { AnyData } from "../../modules/utils/Types"

/**
 * Represents the minimum interface required for a signer implementation.
 * Provides basic signing capabilities for transactions, messages, and typed data.
 */
export type MinimalSigner = {
  /** Signs a transaction with the provided arguments */
  signTransaction: (...args: AnyData[]) => Promise<AnyData>
  /** Signs a message with the provided arguments */
  signMessage: (...args: AnyData[]) => Promise<AnyData>
  /** Signs typed data (EIP-712) with the provided arguments */
  signTypedData: (...args: AnyData[]) => Promise<AnyData>
  /** Optional method to retrieve the signer's address */
  getAddress?: () => Promise<AnyData>
  /** The signer's address */
  address: Address | string
  /** Optional provider instance */
  provider?: AnyData
  /** Allows for additional properties */
  [key: string]: AnyData
}

/** Represents a local account that can sign transactions and messages */
export type Signer = LocalAccount

/**
 * Union type of various signer implementations that can be converted to a LocalAccount.
 * Supports EIP-1193 providers, WalletClients, LocalAccounts, Accounts, and MinimalSigners.
 */
export type UnknownSigner = OneOf<
  | EIP1193Provider
  | WalletClient<Transport, Chain | undefined, Account>
  | LocalAccount
  | Account
  | MinimalSigner
>

/**
 * Converts various signer types into a standardized LocalAccount format.
 * Handles conversion from different wallet implementations including ethers.js wallets,
 * EIP-1193 providers, and existing LocalAccounts.
 *
 * @param signer - The signer to convert, must implement required signing methods
 * @param address - Optional address to use for the account
 * @returns A Promise resolving to a LocalAccount
 *
 * @throws {Error} When signTransaction is called (not supported)
 * @throws {Error} When address is required but not provided
 */
export async function toSigner({
  signer,
  address
}: {
  signer: UnknownSigner & {
    getAddress: () => Promise<string>
    signMessage: (message: AnyData) => Promise<string>
    signTypedData: (
      domain: AnyData,
      types: AnyData,
      value: AnyData
    ) => Promise<string>
  }
  address?: Address
}): Promise<LocalAccount> {
  // ethers Wallet does not have type property
  if ("provider" in signer) {
    return toAccount({
      address: getAddress((await signer.getAddress()) as string),
      async signMessage({ message }): Promise<Hex> {
        if (typeof message === "string") {
          return (await signer.signMessage(message)) as Hex
        }
        // For ethers, raw messages need to be converted to Uint8Array
        if (typeof message.raw === "string") {
          return (await signer.signMessage(hexToBytes(message.raw))) as Hex
        }
        return (await signer.signMessage(message.raw)) as Hex
      },
      async signTransaction(_) {
        throw new Error("Not supported")
      },
      async signTypedData(typedData) {
        return signer.signTypedData(
          typedData.domain as AnyData,
          typedData.types as AnyData,
          typedData.message as AnyData
        ) as Promise<Hex>
      }
    })
  }
  if ("type" in signer && ["local", "dan"].includes(signer.type)) {
    return signer as LocalAccount
  }

  let walletClient:
    | WalletClient<Transport, Chain | undefined, Account>
    | undefined = undefined

  if ("request" in signer) {
    if (!address) {
      try {
        ;[address] = await (signer.request as EIP1193RequestFn<EIP1474Methods>)(
          {
            method: "eth_requestAccounts"
          }
        )
      } catch {
        ;[address] = await (signer.request as EIP1193RequestFn<EIP1474Methods>)(
          {
            method: "eth_accounts"
          }
        )
      }
    }
    if (!address) throw new Error("address required")

    walletClient = createWalletClient({
      account: address,
      transport: custom(signer as EIP1193Provider)
    })
  }

  if (!walletClient) {
    walletClient = signer as WalletClient<Transport, Chain | undefined, Account>
  }

  return toAccount({
    address: walletClient.account.address,
    async signMessage({ message }) {
      return walletClient.signMessage({ message })
    },
    async signTypedData(typedData) {
      return getAction(
        walletClient,
        signTypedData,
        "signTypedData"
      )(typedData as AnyData)
    },
    async signTransaction(_) {
      throw new Error("Not supported")
    }
  })
}
