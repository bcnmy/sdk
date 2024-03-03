import {
  type Address,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  hexToBigInt,
  keccak256
} from "viem"
import { BiconomyInitAbi } from "../../common/utils/abis"
import { BICONOMY_PROXY_CREATION_CODE } from "../../common/utils/constants"

export const getAccountAddress = async ({
  factoryAddress,
  accountLogicAddress,
  fallbackHandlerAddress,
  ecdsaModuleAddress,
  owner,
  index = 0n
}: {
  factoryAddress: Address
  accountLogicAddress: Address
  fallbackHandlerAddress: Address
  ecdsaModuleAddress: Address
  owner: Address
  index?: bigint
}): Promise<Address> => {
  // Build the module setup data
  const ecdsaOwnershipInitData = encodeFunctionData({
    abi: BiconomyInitAbi,
    functionName: "initForSmartAccount",
    args: [owner]
  })

  // Build account init code
  const initialisationData = encodeFunctionData({
    abi: BiconomyInitAbi,
    functionName: "init",
    args: [fallbackHandlerAddress, ecdsaModuleAddress, ecdsaOwnershipInitData]
  })

  const deploymentCode = encodePacked(
    ["bytes", "uint256"],
    [BICONOMY_PROXY_CREATION_CODE, hexToBigInt(accountLogicAddress)]
  )

  const salt = keccak256(
    encodePacked(
      ["bytes32", "uint256"],
      [keccak256(encodePacked(["bytes"], [initialisationData])), index]
    )
  )

  return getContractAddress({
    from: factoryAddress,
    salt,
    bytecode: deploymentCode,
    opcode: "CREATE2"
  })
}
