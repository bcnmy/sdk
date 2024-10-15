import type { Module as ModuleMeta } from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, Transport } from "viem"
import type {
  GetSmartAccountParameter,
  SmartAccount
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import type { NexusAccount } from "../../../account/toNexusAccount"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { installModule } from "../../../clients/decorators/erc7579/installModule"
import {
  type UseSessionModuleGetInitDataArgs,
  getInitData
} from "../toUseSessions"
import addresses from "../../../__contracts/addresses"

export type InstallSessionsParameters<
  TSmartAccount extends SmartAccount | undefined,
  TModuleMeta extends ModuleMeta | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
  initArgs?: UseSessionModuleGetInitDataArgs
  module?: TModuleMeta
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: bigint
}

export async function install<
  TSmartAccount extends SmartAccount | undefined,
  TModuleMeta extends ModuleMeta | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters?: InstallSessionsParameters<TSmartAccount, TModuleMeta>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    module: module_,
    initArgs
  } = parameters ?? {}

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as NexusAccount

  const module = module_ ?? {
    module: addresses.SmartSession,
    type: "validator",
    initData: getInitData(
      initArgs ?? {
        fieldName: "address",
        signerAddress: account.signer.address
      }
    )
  }

  return getAction(
    client,
    installModule,
    "installModule"
  )({
    module,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    account
  })
}
