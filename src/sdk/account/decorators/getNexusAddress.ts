import { type Address, pad, toHex } from "viem"
import type { PublicClient } from "viem"
import {
  MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS,
  NEXUS_ACCOUNT_FACTORY,
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

type K1CounterFactualAddressParams<ExtendedPublicClient extends PublicClient> =
  {
    /** The public client to use for the read contract */
    publicClient: ExtendedPublicClient
    /** The address of the signer */
    signerAddress: Address
    /** The index of the account */
    index?: bigint
    /** The attesters to use */
    attesters?: Address[]
    /** The threshold of the attesters */
    threshold?: number
    /** The factory address to use. Defaults to the mainnet factory address */
    factoryAddress?: Address
  }
export const getK1NexusAddress = async <
  ExtendedPublicClient extends PublicClient
>(
  params: K1CounterFactualAddressParams<ExtendedPublicClient>
): Promise<Address> => {
  const {
    publicClient,
    signerAddress,
    index = 0n,
    attesters = [RHINESTONE_ATTESTER_ADDRESS],
    threshold = 1,
    factoryAddress = MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
  } = params

  return await publicClient.readContract({
    address: factoryAddress,
    abi: K1ValidatorFactoryAbi,
    functionName: "computeAccountAddress",
    args: [signerAddress, index, attesters, threshold]
  })
}

type MeeCounterFactualAddressParams<ExtendedPublicClient extends PublicClient> =
  {
    /** The public client to use for the read contract */
    publicClient: ExtendedPublicClient
    /** The address of the signer */
    signerAddress: Address
    /** The salt for the account */
    index?: bigint
  }

export const getMeeNexusAddress = async (
  params: MeeCounterFactualAddressParams<PublicClient>
) => {
  const salt = pad(toHex(params.index ?? 0n), { size: 32 })
  const { publicClient, signerAddress } = params

  return await publicClient.readContract({
    address: NEXUS_ACCOUNT_FACTORY,
    abi: AccountFactoryAbi,
    functionName: "computeAccountAddress",
    args: [signerAddress, salt]
  })
}
