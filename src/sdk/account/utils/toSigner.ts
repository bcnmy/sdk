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

export type MinimalSigner = {
  signTransaction: (...args: any[]) => Promise<any>
  signMessage: (...args: any[]) => Promise<any>
  signTypedData: (...args: any[]) => Promise<any>
  getAddress?: () => Promise<any>
  address?: any
  provider?: any
  [key: string]: any
}

export type Signer = LocalAccount
export type UnknownSigner = OneOf<
  | EIP1193Provider
  | WalletClient<Transport, Chain | undefined, Account>
  | LocalAccount
  | Account
  | MinimalSigner
>
export async function toSigner({
  signer,
  address
}: {
  signer: UnknownSigner & {
    getAddress: () => Promise<string>
    signMessage: (message: any) => Promise<string>
    signTypedData: (domain: any, types: any, value: any) => Promise<string>
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
          typedData.domain as any,
          typedData.types as any,
          typedData.message as any
        ) as Promise<Hex>
      }
    })
  }
  if ("type" in signer && signer.type === "local") {
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
      )(typedData as any)
    },
    async signTransaction(_) {
      throw new Error("Not supported")
    }
  })
}
