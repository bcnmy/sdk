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
import { NexusBootstrapAbi } from "../../constants/abi/NexusBootstrapAbi"

export type GetK1FactoryDataParams = {
  signerAddress: Address
  index: bigint
  attesters: Address[]
  attesterThreshold: number
}
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

export type GetMeeFactoryDataParams = GetK1FactoryDataParams & {
  validatorAddress: Address
  registryAddress: Address
  publicClient: PublicClient
  walletClient: WalletClient
  bootStrapAddress: Address
}
export const getMeeFactoryData = async ({
  validatorAddress,
  attesters,
  registryAddress,
  attesterThreshold,
  publicClient,
  walletClient,
  bootStrapAddress,
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
