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

import { getBytecode, signTypedData } from "viem/actions"
import type { SmartAccountSigner } from "./types.js"

/**
 * Converts a wallet client to a smart account signer.
 * @template TChain - The type of chain.
 * @param {WalletClient<Transport, TChain, Account>} walletClient - The wallet client to convert.
 * @returns {SmartAccountSigner<"custom", Address>} - The converted smart account signer.
 */
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

/**
 * Checks if a smart account is deployed at the given address.
 * @param client - The client object used to interact with the blockchain.
 * @param address - The address of the smart account.
 * @returns A promise that resolves to a boolean indicating whether the smart account is deployed or not.
 */
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
