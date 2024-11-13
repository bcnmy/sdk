import {
  EphAuth,
  NetworkSigner,
  WalletProviderServiceClient
} from "@silencelaboratories/walletprovider-sdk"
import type { Chain, Client, Hex, PartialBy, Transport } from "viem"
import {
  type PrepareUserOperationParameters,
  type UserOperation,
  prepareUserOperation
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { ERROR_MESSAGES, type Signer } from "../../../../account"
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

export const sigGen = async <
  TModularSmartAccount extends ModularSmartAccount | undefined,
  chain extends Chain | undefined
>(
  client: Client<Transport, chain, TModularSmartAccount>,
  parameters: SigGenParameters
): Promise<Partial<UserOperation>> => {
  const {
    walletProviderUrl = DEFAULT_DAN_URL,
    partiesNumber = QUORUM_PARTIES,
    threshold = QUORUM_THRESHOLD,
    chain: chain_ = client.account?.client?.chain,
    keyGenData: { ephSK, ephId, keyId }
  } = parameters ?? {}

  if (!chain_) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
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
      chainId: chain_.id
    }),
    requestType: "accountAbstractionTx"
  })

  const { sign, recid } = await networkSigner.signMessage(keyId, signMessage)

  const recid_hex = (27 + recid).toString(16)
  const signature = `0x${sign}${recid_hex}` as Hex
  return { ...userOperationHexed, signature }
}
