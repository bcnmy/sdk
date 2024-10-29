import { computeAddress } from "@silencelaboratories/walletprovider-sdk"
import type { Chain, Client, Hex, LocalAccount, Transport } from "viem"
import { ERROR_MESSAGES } from "../../../account"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { parseModule } from "../../utils/Helpers"
import type { ModularSmartAccount } from "../../utils/Types"
import type { DanModule } from "../toDan"

export type GenerateMPCKeyResponse = {
  publicKey: Hex
  keyId: Hex
  sessionKeyEOA: Hex
}

export type GenerateMPCKeyParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** The smart account to add the owner to. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
  /** Optional chainId, defaults to the one in the client */
  chain?: Chain
  /** Optional Signer, defaults to the one in the client */
  signer?: LocalAccount
}

export async function generateMPCKey<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters?: GenerateMPCKeyParameters<TModularSmartAccount>
): Promise<GenerateMPCKeyResponse> {
  const {
    account: account_ = client.account,
    chain: chain_ = client.account?.client?.chain
  } = parameters ?? {}

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const { networkSigner, publicKeyAsBytes } = parseModule(client) as DanModule

  if (!chain_) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  }

  const createdKey =
    await networkSigner.authenticateAndCreateKey(publicKeyAsBytes)

  const sessionKeyEOA = computeAddress(createdKey.publicKey)

  console.log({ createdKey, sessionKeyEOA })

  return {
    ...createdKey,
    sessionKeyEOA
  } as GenerateMPCKeyResponse
}
