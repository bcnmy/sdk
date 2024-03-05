import type {
  Account,
  Address,
  Chain,
  Client,
  Hex,
  SignableMessage,
  Transport,
  TypedData,
  TypedDataDefinition,
  WalletClient
} from "viem"

export const extractChainIdFromBundlerUrl = (url: string): number => {
  try {
    const regex = /\/api\/v2\/(\d+)\/[a-zA-Z0-9.-]+$/
    const match = regex.exec(url)
    if (!match) {
      throw new Error("No match")
    }
    return parseInt(match[1])
  } catch (error) {
    throw new Error("Invalid chain id")
  }
}

import { getBytecode, signTypedData } from "viem/actions"
import type { SmartAccountSigner } from "./types.js"

export function walletClientToSmartAccountSigner<
  TChain extends Chain | undefined = Chain | undefined
>(
  walletClient: WalletClient<Transport, TChain, Account>
): SmartAccountSigner<"custom", Address> {
  return {
    address: walletClient.account.address,
    type: "local",
    source: "custom",
    publicKey: walletClient.account.address,
    signMessage: async ({
      message
    }: {
      message: SignableMessage
    }): Promise<Hex> => {
      return walletClient.signMessage({ message })
    },
    async signTypedData<
      const TTypedData extends TypedData | Record<string, unknown>,
      TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
    >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      return signTypedData<TTypedData, TPrimaryType, TChain, Account>(
        walletClient,
        {
          account: walletClient.account,
          ...typedData
        }
      )
    }
  }
}

export const isSmartAccountDeployed = async (
  client: Client,
  address: Address
): Promise<boolean> => {
  const contractCode = await getBytecode(client, {
    address: address
  })

  if ((contractCode?.length ?? 0) > 2) {
    return true
  }
  return false
}
