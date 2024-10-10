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

// // @Review
// // This type helps providing other signer types 
// type MinimalSigner = {
//   signMessage(message: any): Promise<string>
//   signTypedData(domain: any, types: any, value: any): Promise<string>
//   [key: string]: any
// }

export type Signer = LocalAccount
export type UnknownSigner = OneOf<
  | EIP1193Provider
  | WalletClient<Transport, Chain | undefined, Account>
  | LocalAccount
  | Account
  | any
>
export async function toSigner({
  signer,
  address
}: {
  signer: UnknownSigner
  address?: Address
}): Promise<LocalAccount> {
  // ethers Wallet does not have type property
  if (!signer.type) {
    return toAccount({
      address: getAddress(signer.address as string),
      async signMessage({ message }): Promise<Hex> {
        if (typeof message === "string") {
          // @ts-ignore
          return (await signer.signMessage(message)) as Hex
        }
        // For ethers, raw messages need to be converted to Uint8Array
        if (typeof message.raw === "string") {
          // @ts-ignore
          return (await signer.signMessage(hexToBytes(message.raw))) as Hex
        }
        // @ts-ignore
        return (await signer.signMessage(message.raw)) as Hex
      },
      async signTransaction(_) {
        throw new Error("Not supported")
      },
      async signTypedData(typedData) {
        // @ts-ignore
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
      // @ts-ignore
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
