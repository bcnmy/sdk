import {
  type Client,
  type LocalAccount,
  type Transport,
  type TypedData,
  type TypedDataDefinition
} from "viem"
import { signMessage, signTypedData } from "viem/actions"
import type { SmartAccountSigner, TChain } from "../../common/utils/types"
import type { BiconomySmartAccountConfig } from "./types"

export const toAccount = (
  client: Client<Transport, TChain, undefined>,
  signer: SmartAccountSigner
) => {
  const viemSigner: LocalAccount = {
    ...signer,
    signTransaction: (_, __) => {
      throw new Error("signTransaction not supported by ERC4337 account")
    }
  } as LocalAccount

  return {
    async signMessage({ message }) {
      return signMessage(client, { account: viemSigner, message })
    },
    async signTransaction() {
      throw new Error("signTransaction not supported by ERC4337 account")
    },
    async signTypedData<
      const TTypedData extends TypedData | Record<string, unknown>,
      TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
    >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      return signTypedData<TTypedData, TPrimaryType, TChain, undefined>(
        client,
        {
          account: viemSigner,
          ...typedData
        }
      )
    }
  }
}

export const validateConfig = (config: BiconomySmartAccountConfig) => {
  if (config.walletClient.account === undefined) {
    throw new Error("walletClient.account is required")
  }
  // ...
}
