import type { Module as ModuleMeta } from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, Transport } from "viem"
import type {
  GetSmartAccountParameter,
  SmartAccount
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import addresses from "../../../__contracts/addresses"
import type { NexusAccount } from "../../../account/toNexusAccount"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { ERROR_MESSAGES } from "../../../account/utils/Constants"
import { installModule } from "../../../clients/decorators/erc7579/installModule"
import { type K1ModuleGetInitDataArgs, getK1InitData } from "../toK1"

export type InstallK1Parameters<
  TSmartAccount extends SmartAccount | undefined,
  TModuleMeta extends ModuleMeta | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
  initArgs?: K1ModuleGetInitDataArgs
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
  parameters?: InstallK1Parameters<TSmartAccount, TModuleMeta>
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
  const signerAddress = initArgs?.signerAddress ?? account?.signer?.address

  if (!signerAddress) {
    throw new Error(ERROR_MESSAGES.SIGNER_REQUIRED_FOR_CREATE_SESSION)
  }

  const module = module_ ?? {
    module: addresses.K1Validator,
    type: "validator",
    initData: getK1InitData({ signerAddress })
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
