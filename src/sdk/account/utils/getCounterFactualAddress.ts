import { type Address, pad, toHex } from "viem"
import type { PublicClient } from "viem"
import {
  MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS,
  MOCK_ATTESTER_ADDRESS,
  NEXUS_BOOTSTRAP_ADDRESS,
  RHINESTONE_ATTESTER_ADDRESS
} from "../../constants"
import { AccountFactoryAbi } from "../../constants/abi/AccountFactory"
import { K1ValidatorFactoryAbi } from "../../constants/abi/K1ValidatorFactory"

/**
 * Get the counterfactual address of a signer
 *
 * @param publicClient - The public client to use for the read contract
 * @param signerAddress - The address of the signer
 * @param index - The index of the account
 * @param isTestnet - Whether the network is testnet
 * @param attesters - The attesters to use
 * @param threshold - The threshold of the attesters
 * @param factoryAddress - The factory address to use
 * @returns The counterfactual address
 *
 * @example
 * ```ts
 *   const counterFactualAddress = await getCounterFactualAddress(publicClient, signerAddress)
 * ```
 */

type K1CounterFactualAddressParams = {
  /** The public client to use for the read contract */
  publicClient: PublicClient
  /** The address of the signer */
  signerAddress: Address
  /** Whether the network is testnet */
  isTestnet?: boolean
  /** The index of the account */
  index?: bigint
  /** The attesters to use */
  attesters?: Address[]
  /** The threshold of the attesters */
  threshold?: number
  /** The factory address to use. Defaults to the mainnet factory address */
  factoryAddress?: Address
}
export const getK1CounterFactualAddress = async (
  params: K1CounterFactualAddressParams
): Promise<Address> => {
  const {
    publicClient,
    signerAddress,
    isTestnet = false,
    index = 0n,
    attesters = [RHINESTONE_ATTESTER_ADDRESS],
    threshold = 1,
    factoryAddress = MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
  } = params

  if (isTestnet) {
    attesters.push(MOCK_ATTESTER_ADDRESS)
  }
  return await publicClient.readContract({
    address: factoryAddress,
    abi: K1ValidatorFactoryAbi,
    functionName: "computeAccountAddress",
    args: [signerAddress, index, attesters, threshold]
  })
}

type MeeCounterFactualAddressParams = {
  /** The public client to use for the read contract */
  publicClient: PublicClient
  /** The address of the signer */
  signerAddress: Address
  /** The salt for the account */
  index: bigint
  /** The factory address to use. Defaults to the mainnet factory address */
  factoryAddress?: Address
}
export const getMeeCounterFactualAddress = async (
  params: MeeCounterFactualAddressParams
) => {
  console.log("getMeeCounterFactualAddress", params)

  const salt = pad(toHex(params.index), { size: 32 })
  const {
    publicClient,
    signerAddress,
    factoryAddress = NEXUS_BOOTSTRAP_ADDRESS
  } = params

  return await publicClient.readContract({
    address: factoryAddress,
    abi: AccountFactoryAbi,
    functionName: "computeAccountAddress",
    args: [signerAddress, salt]
  })
}
