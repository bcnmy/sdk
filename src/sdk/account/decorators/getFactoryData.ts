import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  encodeFunctionData,
  getContract,
  pad,
  parseAbi,
  toHex
} from "viem"
import {
  MEE_VALIDATOR_ADDRESS,
  NEXUS_BOOTSTRAP_ADDRESS,
  REGISTRY_ADDRESS
} from "../../constants"
import { NexusBootstrapAbi } from "../../constants/abi/NexusBootstrapAbi"

/**
 * Parameters for generating K1 factory initialization data
 * @property signerAddress - {@link Address} The address of the EOA signer
 * @property index - Account index as BigInt for deterministic deployment
 * @property attesters - Array of {@link Address} attester addresses for account verification
 * @property attesterThreshold - Minimum number of attesters required for validation
 */
export type GetK1FactoryDataParams = {
  signerAddress: Address
  index: bigint
  attesters: Address[]
  attesterThreshold: number
}

/**
 * Generates encoded factory data for K1 account creation
 *
 * @param params - {@link GetK1FactoryDataParams} Parameters for K1 account creation
 * @param params.signerAddress - The address of the EOA signer
 * @param params.index - Account index for deterministic deployment
 * @param params.attesters - Array of attester addresses
 * @param params.attesterThreshold - Minimum number of attesters required
 *
 * @returns Promise resolving to {@link Hex} encoded function data for account creation
 *
 * @example
 * const factoryData = await getK1FactoryData({
 *   signerAddress: "0x123...",
 *   index: BigInt(0),
 *   attesters: ["0xabc...", "0xdef..."],
 *   attesterThreshold: 2
 * });
 */
export const getK1FactoryData = async ({
  signerAddress,
  index,
  attesters,
  attesterThreshold
}: GetK1FactoryDataParams): Promise<Hex> =>
  encodeFunctionData({
    abi: parseAbi([
      "function createAccount(address eoaOwner, uint256 index, address[] attesters, uint8 threshold) external returns (address)"
    ]),
    functionName: "createAccount",
    args: [signerAddress, index, attesters, attesterThreshold]
  })

/**
 * Parameters for generating MEE factory initialization data
 * @property signerAddress - {@link Address} The address of the EOA signer
 * @property index - Account index as BigInt for deterministic deployment
 * @property attesters - Array of {@link Address} attester addresses for account verification
 * @property attesterThreshold - Minimum number of attesters required for validation
 * @property validatorAddress - Optional {@link Address} of the validator (defaults to MEE_VALIDATOR_ADDRESS)
 * @property registryAddress - Optional {@link Address} of the registry contract (defaults to REGISTRY_ADDRESS)
 * @property publicClient - {@link PublicClient} Viem public client instance
 * @property walletClient - {@link WalletClient} Viem wallet client instance
 * @property bootStrapAddress - Optional {@link Address} of the bootstrap contract (defaults to NEXUS_BOOTSTRAP_ADDRESS)
 */
export type GetMeeFactoryDataParams = GetK1FactoryDataParams & {
  validatorAddress?: Address
  registryAddress?: Address
  publicClient: PublicClient
  walletClient: WalletClient
  bootStrapAddress?: Address
}

/**
 * Generates encoded factory data for MEE account creation
 *
 * @param params - {@link GetMeeFactoryDataParams} Parameters for MEE account creation
 * @param params.validatorAddress - Optional validator address
 * @param params.attesters - Array of attester addresses
 * @param params.registryAddress - Optional registry contract address
 * @param params.attesterThreshold - Minimum number of attesters required
 * @param params.publicClient - Viem public client instance
 * @param params.walletClient - Viem wallet client instance
 * @param params.bootStrapAddress - Optional bootstrap contract address
 * @param params.signerAddress - The address of the EOA signer
 * @param params.index - Account index for deterministic deployment
 *
 * @returns Promise resolving to {@link Hex} encoded function data for account creation
 *
 * @example
 * const factoryData = await getMeeFactoryData({
 *   signerAddress: "0x123...",
 *   index: BigInt(0),
 *   attesters: ["0xabc...", "0xdef..."],
 *   attesterThreshold: 2,
 *   publicClient: viemPublicClient,
 *   walletClient: viemWalletClient,
 *   validatorAddress: "0x789..." // optional
 * });
 */
export const getMeeFactoryData = async ({
  validatorAddress = MEE_VALIDATOR_ADDRESS,
  attesters,
  registryAddress = REGISTRY_ADDRESS,
  attesterThreshold,
  publicClient,
  walletClient,
  bootStrapAddress = NEXUS_BOOTSTRAP_ADDRESS,
  signerAddress,
  index
}: GetMeeFactoryDataParams): Promise<Hex> => {
  const nexusBootstrap = getContract({
    address: bootStrapAddress,
    abi: NexusBootstrapAbi,
    client: {
      public: publicClient,
      wallet: walletClient
    }
  })

  const initData =
    await nexusBootstrap.read.getInitNexusWithSingleValidatorCalldata([
      {
        module: validatorAddress,
        data: signerAddress
      },
      registryAddress,
      attesters,
      attesterThreshold
    ])

  const salt = pad(toHex(index), { size: 32 })

  return encodeFunctionData({
    abi: parseAbi([
      "function createAccount(bytes initData, bytes32 salt) external returns (address)"
    ]),
    functionName: "createAccount",
    args: [initData, salt]
  })
}
