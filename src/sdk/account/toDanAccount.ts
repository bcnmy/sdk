import {
  EOAAuth,
  EphAuth,
  NetworkSigner,
  WalletProviderServiceClient,
  computeAddress,
  generateEphPrivateKey,
  getEphPublicKey
} from "@silencelaboratories/walletprovider-sdk"
import {
  type Chain,
  type Client,
  type Hex,
  type PartialBy,
  type RpcUserOperation,
  toHex
} from "viem"
import {
  type PrepareUserOperationParameters,
  prepareUserOperation
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import type { AnyData } from "../modules/utils/Types"
import {
  DanWallet,
  ERROR_MESSAGES,
  type Signer,
  hexToUint8Array,
  uuid
} from "./utils"
import { deepHexlify } from "./utils/deepHexlify"

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
export type KeyGenParameters = {
  /** Optional Signer, defaults to the one in the client */
  signer: Signer
  /** Chain configuration */
  chain?: Chain
} & DanParameters

/**
 * Configuration parameters for DAN network
 */
export type DanParameters = {
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

export async function keyGen(
  parameters: KeyGenParameters
): Promise<KeyGenData> {
  const {
    walletProviderUrl = DEFAULT_DAN_URL,
    partiesNumber = QUORUM_PARTIES,
    threshold = QUORUM_THRESHOLD,
    duration = EPHEMERAL_KEY_TTL,
    ephId = uuid(),
    chain,
    signer
  } = parameters ?? {}

  if (!signer) {
    throw new Error(ERROR_MESSAGES.SIGNER_REQUIRED)
  }

  if (!chain) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  }

  const skArr = generateEphPrivateKey()
  const ephPKArr = getEphPublicKey(skArr)
  const ephSK = toHex(skArr)

  const wpClient = new WalletProviderServiceClient({
    walletProviderId: "WalletProvider",
    walletProviderUrl
  })

  const wallet = new DanWallet(signer, chain)
  const eoaAuth = new EOAAuth(ephId, signer.address, wallet, ephPKArr, duration)

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

/**
 * Metadata for DAN User Operations
 */
export type DanUSerOperationMeta = {
  /** Version of the entry point contract */
  entryPointVersion: string
  /** Address of the entry point contract */
  entryPointAddress: string
  /** Chain ID where the operation will be executed */
  chainId: number
}

/**
 * Combined type for complete DAN User Operation with metadata
 */
export type RpcUserOperationeration = DanUSerOperationMeta & {
  userOperation: Partial<RpcUserOperation>
}

/**
 * Parameters required for signature generation
 */
export type SigGenParameters = PartialBy<
  PrepareUserOperationParameters & {
    /** Data from previous key generation step */
    keyGenData: KeyGenData
  } & DanParameters,
  "account"
>

export const REQUIRED_FIELDS = [
  "sender",
  "nonce",
  "callData",
  "callGasLimit",
  "verificationGasLimit",
  "preVerificationGas",
  "maxFeePerGas",
  "maxPriorityFeePerGas",
  "factoryData"
]

export const sigGen = async (
  bundlerClient: Client,
  parameters: SigGenParameters
): Promise<Hex> => {
  const {
    walletProviderUrl = DEFAULT_DAN_URL,
    partiesNumber = QUORUM_PARTIES,
    threshold = QUORUM_THRESHOLD,
    keyGenData: { ephSK, ephId, keyId },
    ...userOp
  } = parameters ?? {}

  const chain = bundlerClient?.account?.client?.chain
  if (!chain) throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)

  const ephSKArr = hexToUint8Array(ephSK.slice(2))
  const wpClient = new WalletProviderServiceClient({
    walletProviderId: "WalletProvider",
    walletProviderUrl
  })
  const authModule = new EphAuth(ephId, ephSKArr)

  const networkSigner = new NetworkSigner(
    wpClient,
    threshold,
    partiesNumber,
    authModule
  )

  const preparedUserOperation = await getAction(
    bundlerClient,
    prepareUserOperation,
    "prepareUserOperation"
  )(userOp as PrepareUserOperationParameters)

  const userOperation = REQUIRED_FIELDS.reduce((acc, field) => {
    if (field in preparedUserOperation) {
      acc[field] = preparedUserOperation[field]
    }
    return acc
  }, {} as AnyData)

  const userOperationHexed = deepHexlify(userOperation)

  const signMessage = JSON.stringify({
    message: JSON.stringify({
      userOperation: userOperationHexed,
      entryPointVersion: "v0.7.0",
      entryPointAddress: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
      chainId: chain.id
    }),
    requestType: "accountAbstractionTx"
  })

  const { sign, recid } = await networkSigner.signMessage(keyId, signMessage)

  const recid_hex = (27 + recid).toString(16)
  const signature = `0x${sign}${recid_hex}` as Hex

  return signature
}
