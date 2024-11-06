import {
  EphAuth,
  NetworkSigner,
  WalletProviderServiceClient
} from "@silencelaboratories/walletprovider-sdk"
import type { Chain, Client, Hex, PartialBy, Transport } from "viem"
import {
  type PrepareUserOperationParameters,
  type PrepareUserOperationReturnType,
  prepareUserOperation
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { ERROR_MESSAGES, type Signer } from "../../../../account"
import { AccountNotFoundError } from "../../../../account/utils/AccountNotFound"
import { ENTRY_POINT_ADDRESS } from "../../../../constants"
import type { ModularSmartAccount } from "../../../../modules/utils/Types"
import { hexToUint8Array, stringifyBigInt } from "../Helpers"
import {
  DEFAULT_DAN_URL,
  type DanParameters,
  type KeyGenData,
  QUORUM_PARTIES,
  QUORUM_THRESHOLD
} from "./keyGen"

/**
 * Represents a User Operation for DAN (Distributed Account Network).
 * Contains the basic parameters needed for an ERC-4337 compatible transaction.
 */
export type DANUserOp = {
  /** The sender address of the user operation */
  sender: Hex
  /** Transaction nonce as a string */
  nonce: string
  /** Encoded call data for the transaction */
  callData: string
  /** Gas limit for the main execution as a string */
  callGasLimit: string
  /** Gas limit for the verification step as a string */
  verificationGasLimit: string
  /** Gas required for pre-verification operations as a string */
  preVerificationGas: string
  /** Maximum gas fee the user is willing to pay as a string */
  maxFeePerGas: string
  /** Maximum priority fee for miners as a string */
  maxPriorityFeePerGas: string
  /** Optional paymaster contract address and additional data */
  paymasterAndData: string
  /** Optional factory deployment data */
  factoryData: string
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
export type DANUserOperation = DanUSerOperationMeta & {
  userOperation: Partial<DANUserOp>
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
export type SigGenResponse = {
  /** Generated signature for the user operation */
  signature: Hex
  /** Prepared user operation with all necessary parameters */
  preparedUserOperation: PrepareUserOperationReturnType
}

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
    keyGenData: { ephSK, ephId, keyId }
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

  const userOperation: DANUserOp = {
    sender: preparedUserOperation.sender,
    nonce: stringifyBigInt(preparedUserOperation.nonce),
    callData: preparedUserOperation.callData,
    callGasLimit: stringifyBigInt(preparedUserOperation.callGasLimit),
    verificationGasLimit: stringifyBigInt(
      preparedUserOperation.verificationGasLimit
    ),
    preVerificationGas: stringifyBigInt(
      preparedUserOperation.preVerificationGas
    ),
    maxFeePerGas: stringifyBigInt(preparedUserOperation.maxFeePerGas),
    maxPriorityFeePerGas: stringifyBigInt(
      preparedUserOperation.maxPriorityFeePerGas
    ),
    paymasterAndData: preparedUserOperation.paymasterAndData ?? "",
    factoryData: preparedUserOperation.factoryData ?? ""
  }

  const signMessage = JSON.stringify({
    message: {
      userOperation,
      entryPointVersion: "v0.7.0",
      entryPointAddress: ENTRY_POINT_ADDRESS,
      chainId: chain_.id
    },
    requestType: "accountAbstractionTx"
  })

  const danSignature = await networkSigner.signMessage(keyId, signMessage)

  const v = danSignature.recid
  const sigV = v === 0 ? "1b" : "1c"
  const signature: Hex = `0x${danSignature.sign}${sigV}`

  return { signature, preparedUserOperation }
}
