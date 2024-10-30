import { encodeFunctionData } from "viem"
import type { Chain, Client, Hex, PublicClient, Transport } from "viem"
import { sendUserOperation } from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../../account/utils/AccountNotFound"
import { MOCK_ATTESTER_ADDRESS, REGISTRY_ADDRESS } from "../../../constants"
import type { Execution, ModularSmartAccount } from "../../utils/Types"

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
 * Gets the action data for trusting attesters in the smart session validator's registry.
 * 
 * This function prepares the calldata and execution parameters needed to trust attesters
 * in the registry contract. It encodes the function call with the provided attesters and threshold.
 *
 * @param params - The parameters object
 * @param params.chainId - The ID of the blockchain network
 * @param params.trustAttestersInfo - Configuration for trusting attesters including addresses and threshold
 * @param params.client - The public client used to interact with the blockchain
 * @returns A promise that resolves to an Execution object containing the target, value and calldata,
 *          or an Error if the operation fails
 *
 * @example
 * ```ts
 * const action = await getTrustAttestersAction({
 *   chainId: 1,
 *   trustAttestersInfo: {
 *     attesters: ['0x...', '0x...'],
 *     threshold: 2
 *   },
 *   client: publicClient
 * });
 * ```
 */
// Review if we need this: as it is available in Rhinestone module sdk as well!
export const getTrustAttestersAction = async ({
  chainId,
  trustAttestersInfo,
  client
}: {
  chainId: number
  trustAttestersInfo: TrustAttestersParameters<ModularSmartAccount>
  client: PublicClient
}): Promise<Execution | Error> => {
  const {
    account: account_ = client.account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    attesters = [MOCK_ATTESTER_ADDRESS],
    registryAddress = REGISTRY_ADDRESS,
    threshold = attesters.length
  } = trustAttestersInfo ?? {}

  console.log(chainId, maxFeePerGas, maxPriorityFeePerGas, account_, nonce, attesters, registryAddress, threshold)

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

  return {
    target: registryAddress,
    value: 0n,
    callData: trustAttestersData
  }
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
      docsPath: "/nexus/nexus-client/methods#sendtransaction"
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
