import {
  EOAAuth,
  EphAuth,
  NetworkSigner,
  WalletProviderServiceClient,
  computeAddress,
  generateEphPrivateKey,
  getEphPublicKey
} from "@silencelaboratories/walletprovider-sdk"
import type { Account, Chain, Hex, PartialBy } from "viem"
import {
  type BundlerClient,
  type PrepareUserOperationParameters,
  prepareUserOperation
} from "viem/account-abstraction"
import { toAccount } from "viem/accounts"
import { getAction } from "viem/utils"
import type { AnyData } from "../modules/utils/Types"
import { DanWallet, type Signer, uuid } from "./utils"
import { deepHexlify } from "./utils/deepHexlify"

/**
 * Parameters for key generation
 */
export type ToDanAccountParameters = {
  /** Optional Signer, defaults to the one in the client */
  signer: Signer
  /** Nexus client */
  bundlerClient: BundlerClient
} & DanParameters

/**
 * Configuration parameters for DAN network
 */
export type DanParameters = {
  /** Chain configuration */
  chain: Chain
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
 * Constants for DAN (Distributed Account Network) configuration
 */
export const EPHEMERAL_KEY_TTL = 60 * 60 * 24 // 1 day
export const QUORUM_PARTIES = 3
export const QUORUM_THRESHOLD = 2
export const DEFAULT_DAN_URL = "wss://dan.staging.biconomy.io/v1"

export type UserOpParameters = PartialBy<
  PrepareUserOperationParameters,
  "account"
>

export type DanAccount = Account & {
  signUserOperation: (params: UserOpParameters) => Promise<Hex>
}

export const toDanAccount = async (
  parameters: ToDanAccountParameters
): Promise<DanAccount> => {
  const {
    walletProviderUrl = DEFAULT_DAN_URL,
    partiesNumber = QUORUM_PARTIES,
    threshold = QUORUM_THRESHOLD,
    duration = EPHEMERAL_KEY_TTL,
    ephId = uuid(),
    chain,
    signer,
    bundlerClient
  } = parameters ?? {}

  const skArr = generateEphPrivateKey()
  const ephPKArr = getEphPublicKey(skArr)

  const wpClient = new WalletProviderServiceClient({
    walletProviderId: "WalletProvider",
    walletProviderUrl
  })

  const wallet = new DanWallet(signer, chain)

  const eoaAuth = new EOAAuth(ephId, signer.address, wallet, ephPKArr, duration)

  const networkSignerWithEoa = new NetworkSigner(
    wpClient,
    threshold,
    partiesNumber,
    eoaAuth
  )

  const authModule = new EphAuth(ephId, skArr)

  const networkSignerWithAuthModule = new NetworkSigner(
    wpClient,
    threshold,
    partiesNumber,
    authModule
  )

  const createdKey = await networkSignerWithEoa.generateKey()

  const address = computeAddress(createdKey.publicKey)

  const { keyId } = createdKey

  // @ts-ignore
  const danAccount = toAccount({
    getAddress: async () => address,
    address,

    source: "custom",
    type: "remote",

    async signTypedData(typedData): Promise<Hex> {
      // @ts-ignore
      return await wallet.signTypedData("", typedData)
    },

    async signMessage(_) {
      throw new Error("Not implemented")
    },

    async sign(_) {
      throw new Error("Not implemented")
    },

    async signTransaction(_) {
      throw new Error("Not implemented")
    }
  }) as DanAccount

  danAccount.signUserOperation = async (
    params: UserOpParameters
  ): Promise<Hex> => {
    const ORDERED_DAN_UO_FIELDS = [
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

    const preparedUserOperation = await getAction(
      bundlerClient,
      prepareUserOperation,
      "prepareUserOperation"
    )(params as PrepareUserOperationParameters)

    const userOperation = ORDERED_DAN_UO_FIELDS.reduce((acc, field) => {
      if (field in preparedUserOperation) {
        // @ts-ignore
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

    const result = await networkSignerWithAuthModule.signMessage(
      keyId,
      signMessage
    )

    const { sign, recid } = result

    const recid_hex = (27 + recid).toString(16)
    return `0x${sign}${recid_hex}` as Hex
  }

  return danAccount
}
