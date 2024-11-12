import {
  EOAAuth,
  NetworkSigner,
  WalletProviderServiceClient,
  computeAddress,
  generateEphPrivateKey,
  getEphPublicKey
} from "@silencelaboratories/walletprovider-sdk"
import { type Chain, type Client, type Hex, type Transport, toHex } from "viem"
import { ERROR_MESSAGES, type Signer } from "../../../../account"
import type { ModularSmartAccount } from "../../../../modules/utils/Types"
import { DanWallet, uuid } from "../Helpers"

/**
 * Constants for DAN (Distributed Account Network) configuration
 */
export const EPHEMERAL_KEY_TTL = 60 * 60 * 24 // 1 day
export const QUORUM_PARTIES = 3
export const QUORUM_THRESHOLD = 2
export const DEFAULT_DAN_URL = "wss://dan.staging.biconomy.io/v1"

/**
 * Response data from the key generation process
 */
export type KeyGenData = {
  /** The generated public key */
  publicKey: Hex
  /** Unique identifier for the generated key */
  keyId: Hex
  /** EOA address derived from the session key */
  sessionPublicKey: Hex
  /** Secret key of the ephemeral key pair */
  ephSK: Hex
  /** Unique identifier for the ephemeral key */
  ephId: Hex
}

/**
 * Parameters for key generation
 */
export type KeyGenParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** The smart account to add the owner to. If not provided, the client's account will be used */
  account?: TModularSmartAccount
  /** Optional Signer, defaults to the one in the client */
  signer?: Signer
  /** Secret key of the ephemeral key pair */
  ephSK: Hex
} & DanParameters

/**
 * Configuration parameters for DAN network
 */
export type DanParameters = {
  /** Chain configuration */
  chain?: Chain
  /** Minimum number of parties required for signing (default: 2) */
  threshold?: number
  /** Total number of parties in the signing group (default: 3) */
  partiesNumber?: number
  /** Duration of the ephemeral key validity in seconds (default: 24 hours) */
  duration?: number
  /** URL of the wallet provider service */
  walletProviderUrl?: string
  /** Unique identifier for the ephemeral key */
  ephId?: string
}

/**
 * Generates a key using the Distributed Account Network (DAN).
 *
 * @typeParam TModularSmartAccount - The type of the modular smart account, or undefined.
 * @param client - The viem client instance.
 * @param parameters - Optional parameters for key generation.
 * @returns A Promise that resolves to the key generation data.
 */
export async function keyGen<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters?: KeyGenParameters<TModularSmartAccount>
): Promise<KeyGenData> {
  const {
    signer: signer_ = client?.account?.client?.account as Signer,
    walletProviderUrl = DEFAULT_DAN_URL,
    partiesNumber = QUORUM_PARTIES,
    threshold = QUORUM_THRESHOLD,
    duration = EPHEMERAL_KEY_TTL,
    ephId = uuid(),
    chain: chain_ = client.account?.client?.chain
  } = parameters ?? {}

  if (!signer_) {
    throw new Error(ERROR_MESSAGES.SIGNER_REQUIRED)
  }

  if (!chain_) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  }

  const skArr = generateEphPrivateKey()
  const ephPKArr = getEphPublicKey(skArr)
  const ephSK = toHex(skArr)

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

  const createdKey = await networkSigner.generateKey()

  const sessionPublicKey = computeAddress(createdKey.publicKey)

  return {
    ...createdKey,
    sessionPublicKey,
    ephSK,
    ephId
  } as KeyGenData
}
