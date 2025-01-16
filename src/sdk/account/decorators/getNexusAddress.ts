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
 * Parameters for getting the K1 counterfactual address
 * @property publicClient - {@link PublicClient} The public client to use for the read contract
 * @property signerAddress - {@link Address} The address of the EOA signer
 * @property index - Optional BigInt index for deterministic deployment (defaults to 0)
 * @property attesters - Optional array of {@link Address} attester addresses (defaults to [RHINESTONE_ATTESTER_ADDRESS])
 * @property threshold - Optional number of required attesters (defaults to 1)
 * @property factoryAddress - Optional {@link Address} of the factory contract (defaults to MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS)
 */
export type K1CounterFactualAddressParams<
  ExtendedPublicClient extends PublicClient
> = {
  publicClient: ExtendedPublicClient
  signerAddress: Address
  index?: bigint
  attesters?: Address[]
  threshold?: number
  factoryAddress?: Address
}

/**
 * Gets the counterfactual address for a K1 Nexus account
 *
 * @param params - {@link K1CounterFactualAddressParams} Configuration for address computation
 * @param params.publicClient - The public client to use for the read contract
 * @param params.signerAddress - The address of the EOA signer
 * @param params.index - Optional account index (defaults to 0)
 * @param params.attesters - Optional array of attester addresses
 * @param params.threshold - Optional attestation threshold
 * @param params.factoryAddress - Optional factory contract address
 *
 * @returns Promise resolving to the {@link Address} of the counterfactual account
 *
 * @example
 * const accountAddress = await getK1NexusAddress({
 *   publicClient: viemPublicClient,
 *   signerAddress: "0x123...",
 *   index: BigInt(0),
 *   attesters: ["0xabc..."],
 *   threshold: 1
 * });
 */
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

/**
 * Parameters for getting the MEE counterfactual address
 * @property publicClient - {@link PublicClient} The public client to use for the read contract
 * @property signerAddress - {@link Address} The address of the EOA signer
 * @property index - Optional BigInt index for deterministic deployment (defaults to 0)
 */
export type MeeCounterFactualAddressParams<
  ExtendedPublicClient extends PublicClient
> = {
  publicClient: ExtendedPublicClient
  signerAddress: Address
  index?: bigint
}

/**
 * Gets the counterfactual address for a MEE Nexus account
 *
 * @param params - {@link MeeCounterFactualAddressParams} Configuration for address computation
 * @param params.publicClient - The public client to use for the read contract
 * @param params.signerAddress - The address of the EOA signer
 * @param params.index - Optional account index (defaults to 0)
 *
 * @returns Promise resolving to the {@link Address} of the counterfactual account
 *
 * @example
 * const accountAddress = await getMeeNexusAddress({
 *   publicClient: viemPublicClient,
 *   signerAddress: "0x123...",
 *   index: BigInt(0)
 * });
 */
export const getMeeNexusAddress = async (
  params: MeeCounterFactualAddressParams<PublicClient>
): Promise<Address> => {
  const salt = pad(toHex(params.index ?? 0n), { size: 32 })
  const { publicClient, signerAddress } = params

  return await publicClient.readContract({
    address: NEXUS_ACCOUNT_FACTORY,
    abi: AccountFactoryAbi,
    functionName: "computeAccountAddress",
    args: [signerAddress, salt]
  })
}
