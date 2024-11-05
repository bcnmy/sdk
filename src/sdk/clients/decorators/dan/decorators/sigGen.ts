import {
  EphAuth,
  NetworkSigner,
  WalletProviderServiceClient
} from "@silencelaboratories/walletprovider-sdk"
import type { Chain, Client, Hex, Transport } from "viem"
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
  QUORUM_PARTIES,
  QUORUM_THRESHOLD
} from "./keyGen"

export type DANUserOp = {
  sender: string
  nonce: bigint
  data: string
  signature: string
  verificationGasLimit: bigint
  preVerificationGas: bigint
  callData: string
  callGasLimit: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  account: object // You might want to define a more specific type for this
  factory: string
  factoryData: string
}

export type DanUSerOperationMeta = {
  entryPointVersion: string
  entryPointAddress: string
  chainId: number
}

export type DANUserOperation = DanUSerOperationMeta & {
  userOperation: Partial<DANUserOp>
}

export type SigGenParameters = PrepareUserOperationParameters & {
  /** Optional Signer, defaults to the one in the client */
  signer?: Signer
  /** Secret key of the ephemeral key pair */
  ephSK: Hex
  /** Ephemeral Key ID */
  ephId: string
  /** Key ID */
  keyId: string
} & DanParameters

export type SigGenResponse = {
  signature: Hex
  preparedUserOperation: PrepareUserOperationReturnType
}

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
    ephSK,
    ephId,
    keyId
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
  )(parameters)

  const filteredUserOperation = {
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
    message: JSON.stringify({
      userOperation: filteredUserOperation,
      entryPointVersion: "v0.7.0",
      entryPointAddress: ENTRY_POINT_ADDRESS,
      chainId: chain_.id
    }),
    requestType: "accountAbstractionTx"
  })

  const danSignature = await networkSigner.authenticateAndSign(
    keyId,
    signMessage
  )

  const v = danSignature.recid
  const sigV = v === 0 ? "1b" : "1c"
  const signature: Hex = `0x${danSignature.sign}${sigV}`

  return { signature, preparedUserOperation }
}
