import {
  type Chain,
  type Client,
  type Hex,
  type Transport,
  encodeAbiParameters,
  encodeFunctionData,
  getAddress
} from "viem"
import {
  type GetSmartAccountParameter,
  type SmartAccount,
  sendUserOperation
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { parseAccount } from "viem/utils"
import { type Module, getInstalledValidators, getPreviousModule } from "."
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { parseModuleTypeId } from "./supportsModule"

export type UninstallModuleParameters<
  TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
  module: Module
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: bigint
}

/**
 * Uninstalls a module from a smart account.
 *
 * @param client - The client instance.
 * @param parameters - Parameters including the smart account, module to uninstall, and optional gas settings.
 * @returns The hash of the user operation as a hexadecimal string.
 * @throws {AccountNotFoundError} If the account is not found.
 *
 * @example
 * import { uninstallModule } from '@biconomy/sdk'
 *
 * const userOpHash = await uninstallModule(nexusClient, {
 *   module: {
 *     type: 'executor',
 *     address: '0x...',
 *     context: '0x'
 *   }
 * })
 * console.log(userOpHash) // '0x...'
 */
export async function uninstallModule<
  TSmartAccount extends SmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TSmartAccount>,
  parameters: UninstallModuleParameters<TSmartAccount> & {
    signatureOverride?: Hex
  }
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    module: { address, data, type },
    signatureOverride
  } = parameters

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/docs/actions/wallet/sendTransaction"
    })
  }

  const account = parseAccount(account_) as SmartAccount
  const [installedValidators] = await getInstalledValidators(client)

  const prevModule = await getPreviousModule(client, {
    module: {
      address,
      type
    },
    installedValidators,
    account
  })

  const deInitData = encodeAbiParameters(
    [
      { name: "prev", type: "address" },
      { name: "disableModuleData", type: "bytes" }
    ],
    [prevModule, data ?? "0x"]
  )

  return getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
  )({
    calls: [
      {
        to: account.address,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: [
            {
              name: "uninstallModule",
              type: "function",
              stateMutability: "nonpayable",
              inputs: [
                {
                  type: "uint256",
                  name: "moduleTypeId"
                },
                {
                  type: "address",
                  name: "module"
                },
                {
                  type: "bytes",
                  name: "deInitData"
                }
              ],
              outputs: []
            }
          ],
          functionName: "uninstallModule",
          args: [parseModuleTypeId(type), getAddress(address), deInitData]
        })
      }
    ],
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    account,
    signature: signatureOverride
  })
}
