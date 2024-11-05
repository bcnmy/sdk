import {
  EOAAuth,
  NetworkSigner,
  WalletProviderServiceClient,
  computeAddress
} from "@silencelaboratories/walletprovider-sdk"
import type { Chain, Client, Hex, Transport } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { ERROR_MESSAGES, type Signer } from "../../../../account"
import { AccountNotFoundError } from "../../../../account/utils/AccountNotFound"
import type { ModularSmartAccount } from "../../../../modules/utils/Types"
import { DanWallet, hexToUint8Array, uuid } from "../Helpers"

export const EPHEMERAL_KEY_TTL = 60 * 60 * 24 // 1 day
export const QUORUM_PARTIES = 3
export const QUORUM_THRESHOLD = 2
export const DEFAULT_DAN_URL = "wss://dan.staging.biconomy.io/v1"

export type KeyGenResponse = {
  publicKey: Hex
  keyId: Hex
  sessionKeyEOA: Hex
  ephSK: Hex
  ephId: Hex
}

export type KeyGenParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** The smart account to add the owner to. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
  /** Optional Signer, defaults to the one in the client */
  signer?: Signer
  /** Secret key of the ephemeral key pair */
  ephSK: Hex
} & DanParameters

export type DanParameters = {
  chain?: Chain
  threshold?: number
  partiesNumber?: number
  duration?: number
  walletProviderUrl?: string
  ephId?: string
}

export async function keyGen<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters?: KeyGenParameters<TModularSmartAccount>
): Promise<KeyGenResponse> {
  const {
    account: account_ = client.account,
    signer: signer_ = account_?.client?.account as Signer,
    walletProviderUrl = DEFAULT_DAN_URL,
    partiesNumber = QUORUM_PARTIES,
    threshold = QUORUM_THRESHOLD,
    duration = EPHEMERAL_KEY_TTL,
    ephId = uuid(),
    chain: chain_ = account_?.client.chain
  } = parameters ?? {}

  if (!signer_) {
    throw new Error(ERROR_MESSAGES.SIGNER_REQUIRED)
  }

  if (!chain_) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  }

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const ephSK = generatePrivateKey()
  const ephPK = privateKeyToAccount(ephSK).address.slice(2)
  const ephPKArr = hexToUint8Array(ephPK)

  const wpClient = new WalletProviderServiceClient({
    walletProviderId: "WalletProvider",
    walletProviderUrl
  })

  const wallet = new DanWallet(signer_, chain_)

  const eoaAuth = new EOAAuth(
    ephId,
    signer_.address,
    wallet,
    ephPKArr,
    duration
  )

  const networkSigner = new NetworkSigner(
    wpClient,
    threshold,
    partiesNumber,
    eoaAuth
  )

  const createdKey = await networkSigner.authenticateAndCreateKey(ephPKArr)

  const sessionKeyEOA = computeAddress(createdKey.publicKey) // Bestow this address with permissions

  console.log({ createdKey })

  return {
    ...createdKey,
    sessionKeyEOA,
    ephSK,
    ephId
  } as KeyGenResponse
}
