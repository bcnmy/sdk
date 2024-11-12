import { encodeFunctionData } from "viem"
import type { Chain, Client, Hex, Transport } from "viem"
import { sendUserOperation } from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { MOCK_ATTESTER_ADDRESS, REGISTRY_ADDRESS } from "../../../constants"
import type { ModularSmartAccount } from "../../utils/Types"

/**
 * Parameters for trusting attesters in a smart session validator.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 */
export type TrustAttestersParameters<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** The addresses of the attesters to be trusted. */
  attesters?: Hex[]
  /** The address of the registry contract. */
  registryAddress?: Hex
  /** The maximum fee per gas unit the transaction is willing to pay. */
  maxFeePerGas?: bigint
  /** The maximum priority fee per gas unit the transaction is willing to pay. */
  maxPriorityFeePerGas?: bigint
  /** The nonce of the transaction. If not provided, it will be determined automatically. */
  nonce?: bigint
  /** The modular smart account to use for trusting attesters. If not provided, the client's account will be used. */
  account?: TModularSmartAccount
  /** The threshold of the attesters to be trusted. */
  threshold?: number
}

/**
 * Trusts attesters for the smart session validator.
 *
 * This function prepares and sends a user operation to trust specified attesters
 * in the smart session validator's registry.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 * @param client - The client used to interact with the blockchain.
 * @param parameters - Parameters including the attesters to trust, registry address, and optional gas settings.
 * @returns A promise that resolves to the hash of the sent user operation.
 *
 * @throws {AccountNotFoundError} If no account is provided and the client doesn't have an associated account.
 *
 * @example
 * ```typescript
 * const result = await trustAttesters(nexusClient, {
 *   attesters: ['0x1234...', '0x5678...'],
 *   registryAddress: '0xabcd...',
 *   maxFeePerGas: 1000000000n
 * });
 * console.log(`Transaction hash: ${result}`);
 * ```
 *
 * @remarks
 * - Ensure that the client has sufficient gas to cover the transaction.
 * - The registry address should be the address of the contract managing trusted attesters.
 */
export async function trustAttesters<
  TModularSmartAccount extends ModularSmartAccount | undefined
>(
  client: Client<Transport, Chain | undefined, TModularSmartAccount>,
  parameters?: TrustAttestersParameters<TModularSmartAccount>
): Promise<Hex> {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    attesters = [MOCK_ATTESTER_ADDRESS],
    registryAddress = REGISTRY_ADDRESS,
    threshold = attesters.length
  } = parameters ?? {}

  if (!account_) {
    throw new AccountNotFoundError({
      docsPath: "/nexus-client/methods#sendtransaction"
    })
  }

  const account = parseAccount(account_) as ModularSmartAccount

  const trustAttestersData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { internalType: "uint8", name: "threshold", type: "uint8" },
          { internalType: "address[]", name: "attesters", type: "address[]" }
        ],
        name: "trustAttesters",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      }
    ],
    functionName: "trustAttesters",
    args: [threshold, attesters]
  })

  return getAction(
    client,
    sendUserOperation,
    "sendUserOperation"
  )({
    calls: [
      {
        to: registryAddress,
        value: 0n,
        data: trustAttestersData
      }
    ],
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    account
  })
}
