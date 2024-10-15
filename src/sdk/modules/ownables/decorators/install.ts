import {
  OWNABLE_VALIDATOR_ADDRESS,
  type Module as ModuleMeta
} from "@rhinestone/module-sdk"
import type { Chain, Client, Hex, Transport } from "viem"
import type {
  GetSmartAccountParameter,
  SmartAccount
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import type { NexusAccount } from "../../../account/toNexusAccount"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { installModule } from "../../../clients/decorators/erc7579/installModule"
import { getInitData, type OwnablesModuleGetInitDataArgs } from "../toOwnables"

export type InstallOwnablesParameters<
  TSmartAccount extends SmartAccount | undefined,
  TModuleMeta extends ModuleMeta | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
  initArgs?: OwnablesModuleGetInitDataArgs
  module?: TModuleMeta
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: bigint
}
/**
 * Installs the Ownables module on a smart account.
 *
 * @param client - The client instance to use for the installation.
 * @param parameters - Optional parameters for the installation.
 * @returns A promise that resolves to the transaction hash (Hex).
 *
 * @example
 * ```typescript
 * import { createNexusClient } from '@rhinestone/sdk'
 * import { install } from '@rhinestone/sdk/modules/ownables'
 *
 * const client = createNexusClient({
 *   chain: mainnet,
 *   transport: http()
 * })
 *
 * const txHash = await install(client, {
 *   account: mySmartAccount,
 *   initArgs: {
 *     owners: ['0x1234...', '0x5678...'],
 *     threshold: 2
 *   },
 *   maxFeePerGas: 1000000000n,
 *   maxPriorityFeePerGas: 100000000n
 * })
 *
 * console.log('Installation transaction hash:', txHash)
 * ```
 */
export async function install<
  TSmartAccount extends SmartAccount | undefined,
  TModuleMeta extends ModuleMeta | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters?: InstallOwnablesParameters<TSmartAccount, TModuleMeta>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    initArgs,
    module: module_
  } = parameters ?? {}

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as NexusAccount

  const module = module_ ?? {
    module: OWNABLE_VALIDATOR_ADDRESS,
    type: "validator",
    initData: getInitData(
      initArgs ?? {
        threshold: 1n,
        owners: [account.signer.address]
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
