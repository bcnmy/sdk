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

export type Signer = LocalAccount
export type UnknownSigner = OneOf<
  | EIP1193Provider
  | WalletClient<Transport, Chain | undefined, Account>
  | LocalAccount
>

export type EthersProvider = {
  getAddress: () => Promise<string>
  signMessage: (message: AnyData) => Promise<string>
  signTypedData: (
    domain: AnyData,
    types: AnyData,
    value: AnyData
  ) => Promise<string>
}

export async function toSigner({
  signer,
  address
}: {
  signer: Signer
  address?: Address
}): Promise<LocalAccount> {
  if ("provider" in signer) {
    const ethersProvider = signer as unknown as EthersProvider
    return toAccount({
      address: getAddress((await ethersProvider?.getAddress()) as string),
      async signMessage({ message }): Promise<Hex> {
        if (typeof message === "string") {
          return (await ethersProvider.signMessage(message)) as Hex
        }
        // For ethers, raw messages need to be converted to Uint8Array
        if (typeof message.raw === "string") {
          return (await ethersProvider.signMessage(
            hexToBytes(message.raw)
          )) as Hex
        }
        return (await ethersProvider.signMessage(message.raw)) as Hex
      },
      async signTransaction(_) {
        throw new Error("Not supported")
      },
      async signTypedData(typedData) {
        return ethersProvider.signTypedData(
          typedData.domain as AnyData,
          typedData.types as AnyData,
          typedData.message as AnyData
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
    if (!address) {
      // For TS to be happy
      throw new Error("address is required")
    }
    walletClient = createWalletClient({
      account: address,
      transport: custom(signer as unknown as EIP1193Provider)
    })
  }

  if (!walletClient) {
    walletClient = signer as unknown as WalletClient<
      Transport,
      Chain | undefined,
      Account
    >
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
      throw new Error("Smart account signer doesn't need to sign transactions")
    }
  })
}
