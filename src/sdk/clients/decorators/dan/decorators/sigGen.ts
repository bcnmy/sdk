import {
  EphAuth,
  NetworkSigner,
  WalletProviderServiceClient,
  computeAddress
} from "@silencelaboratories/walletprovider-sdk"
import type {
  Address,
  Chain,
  Client,
  Hex,
  PartialBy,
  RpcUserOperation,
  Transport
} from "viem"
import {
  type PrepareUserOperationParameters,
  type UserOperation,
  formatUserOperationRequest,
  prepareUserOperation
} from "viem/account-abstraction"
import { getAction, toHex, verifyMessage } from "viem/utils"
import { ERROR_MESSAGES, type Signer } from "../../../../account"
import { AccountNotFoundError } from "../../../../account/utils/AccountNotFound"
import { deepHexlify } from "../../../../account/utils/deepHexlify"
import type {
  AnyData,
  ModularSmartAccount
} from "../../../../modules/utils/Types"
import { hexToUint8Array } from "../Helpers"
import {
  DEFAULT_DAN_URL,
  type DanParameters,
  type KeyGenData,
  QUORUM_PARTIES,
  QUORUM_THRESHOLD
} from "./keyGen"
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
    /** Optional Signer, defaults to the one in the client */
    signer?: Signer
    /** Data from previous key generation step */
    keyGenData: KeyGenData
  } & DanParameters,
  "account"
>

/**
 * Response from signature generation process
 */
export type SigGenResponse = UserOperation<"0.7", Hex>

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

/**
 * Generates a signature for a user operation using DAN protocol
 *
 * @param client - The client instance containing account and chain information
 * @param parameters - Parameters for signature generation including key data and operation details
 * @returns Generated signature and prepared user operation
 * @throws {Error} When signer or chain is not provided
 * @throws {AccountNotFoundError} When account is not found
 */
export const sigGen = async <
  TModularSmartAccount extends ModularSmartAccount | undefined,
  chain extends Chain | undefined
>(
  client: Client<Transport, chain, TModularSmartAccount>,
  parameters: SigGenParameters
): Promise<SigGenResponse> => {
  const {
    account: account_ = client.account,
    signer: signer_ = account_?.client?.account as Signer,
    walletProviderUrl = DEFAULT_DAN_URL,
    partiesNumber = QUORUM_PARTIES,
    threshold = QUORUM_THRESHOLD,
    chain: chain_ = account_?.client.chain,
    keyGenData: { ephSK, ephId, keyId, publicKey }
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
    client,
    prepareUserOperation,
    "prepareUserOperation"
  )(parameters as PrepareUserOperationParameters)

  const userOperation = REQUIRED_FIELDS.reduce((acc, field) => {
    if (field in preparedUserOperation) {
      acc[field] = preparedUserOperation[field]
    }
    return acc
  }, {} as AnyData)

  const userOperationHexed = deepHexlify(userOperation)

  console.log({ userOperation })

  const signMessage = JSON.stringify({
    message: JSON.stringify({
      userOperation: userOperationHexed,
      entryPointVersion: "v0.7.0",
      entryPointAddress: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
      chainId: chain_.id
    }),
    requestType: "accountAbstractionTx"
  })

  const { sign, recid } = await networkSigner.signMessage(keyId, signMessage)

  const recid_hex = (27 + recid).toString(16)
  const signature = `0x${sign}${recid_hex}` as Hex

  // @ts-ignore
  const userOpHash = await account_.getUserOpHash({
    ...userOperation,
    signature
  })

  const ethAddress = computeAddress(publicKey)
  const valid = await verifyMessage({
    address: ethAddress,
    message: { raw: userOpHash },
    signature
  })

  if (!valid) {
    throw new Error("Invalid signature")
  }

  return { ...userOperationHexed, signature }
}
