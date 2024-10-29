import {
  EOAAuth,
  NetworkSigner,
  WalletProviderServiceClient
} from "@silencelaboratories/walletprovider-sdk"
import type { Chain, Hex } from "viem"
// import { parseAccount } from "viem/accounts"
// import type { NexusAccount } from "../../account/toNexusAccount"
import { ERROR_MESSAGES } from "../../account/utils/Constants"
import type { Signer } from "../../account/utils/toSigner"
import type { ModularSmartAccount, Module } from "../utils/Types"
import { toModule } from "../utils/toModule"
import { DanWallet, hexToUint8Array } from "./Helpers"

export type ToDANParameters = {
  account: ModularSmartAccount
  signer?: Signer
  chain?: Chain
  threshold?: number
  partiesNumber?: number
  duration?: number
  walletProviderUrl?: string
  id?: string
}

export const DEFAULT_SESSION_DURATION = 60 * 60 * 24 // 1 day
export const QUORUM_PARTIES = 5
export const QUORUM_THRESHOLD = 3
export const DEFAULT_DAN_URL = "wss://dan.staging.biconomy.io/v1"

export const toDAN = (parameters: ToDANParameters): Module => {
  const {
    account: account_,
    signer: signer_ = account_?.client?.account as Signer,
    walletProviderUrl = DEFAULT_DAN_URL,
    partiesNumber = QUORUM_PARTIES,
    threshold = QUORUM_THRESHOLD,
    duration = DEFAULT_SESSION_DURATION,
    id = "dan_signer_id",
    chain: chain_ = account_.client.chain
  } = parameters

  if (!account_) {
    throw new Error(ERROR_MESSAGES.ACCOUNT_REQUIRED)
  }

  if (!signer_) {
    throw new Error(ERROR_MESSAGES.SIGNER_REQUIRED)
  }

  if (!chain_) {
    throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND)
  }

  // const account = parseAccount(account_) as NexusAccount

  const publicKeyAsBytes: Uint8Array = hexToUint8Array(signer_.address.slice(2))

  const wpClient = new WalletProviderServiceClient({
    walletProviderId: "WalletProvider",
    walletProviderUrl
  })

  const wallet = new DanWallet(signer_)

  const eoaAuth = new EOAAuth(
    id,
    signer_.address,
    wallet,
    publicKeyAsBytes,
    duration
  )

  const networkSigner = new NetworkSigner(
    wpClient,
    threshold,
    partiesNumber,
    eoaAuth
  )

  return toModule({
    initArgs: {
      networkSigner,
      partiesNumber,
      threshold,
      duration,
      id
    },
    signer: signer_,
    accountAddress: account_.address,
    address: "0x",
    initData: "0x",
    moduleInitData: {
      address: "0x",
      type: "fallback"
    },
    deInitData: "0x",
    signUserOpHash: async (userOpHash: Hex) => {
      console.log("in here!")
      return userOpHash
    }
  })
}
