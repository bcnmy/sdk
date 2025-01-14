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
 * @interface GetK1FactoryDataParams
 * @property {Address} signerAddress - The address of the EOA signer
 * @property {bigint} index - The account index
 * @property {Address[]} attesters - Array of attester addresses
 * @property {number} attesterThreshold - Minimum number of attesters required
 */
export type GetK1FactoryDataParams = {
  signerAddress: Address
  index: bigint
  attesters: Address[]
  attesterThreshold: number
}

/**
 * Generates encoded factory data for K1 account creation
 * @param {GetK1FactoryDataParams} params - Parameters for K1 account creation
 * @returns {Promise<Hex>} Encoded function data for account creation
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
 * @interface GetMeeFactoryDataParams
 * @extends {GetK1FactoryDataParams}
 * @property {Address} validatorAddress - The address of the validator
 * @property {Address} registryAddress - The address of the registry contract
 * @property {PublicClient} publicClient - Viem public client instance
 * @property {WalletClient} walletClient - Viem wallet client instance
 * @property {Address} bootStrapAddress - The address of the bootstrap contract
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
 * @param {GetMeeFactoryDataParams} params - Parameters for MEE account creation
 * @returns {Promise<Hex>} Encoded function data for account creation
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

  const factoryData = encodeFunctionData({
    abi: parseAbi([
      "function createAccount(bytes initData, bytes32 salt) external returns (address)"
    ]),
    functionName: "createAccount",
    args: [initData, salt]
  })

  return factoryData
}
