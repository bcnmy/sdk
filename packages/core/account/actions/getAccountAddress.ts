import {
  type Address,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  hexToBigInt,
  keccak256
} from "viem"
import {
  BICONOMY_PROXY_CREATION_CODE,
  BiconomyInitAbi
} from "../../common/index.js"
import { type BaseValidationModule } from "../../modules/index.js"

export const getAccountAddress = async ({
  factoryAddress,
  accountLogicAddress,
  fallbackHandlerAddress,
  validationModule,
  index = 0n
}: {
  factoryAddress: Address
  accountLogicAddress: Address
  fallbackHandlerAddress: Address
  validationModule: BaseValidationModule
  index?: bigint
}): Promise<Address> => {
  const validationModuleInitData = await validationModule.getInitData()

  try {
    const initialisationData = encodeFunctionData({
      abi: BiconomyInitAbi,
      functionName: "init",
      args: [
        fallbackHandlerAddress,
        validationModule.getModuleAddress(),
        validationModuleInitData
      ]
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
  } catch (error) {
    throw new Error(`Failed to get counterfactual address, ${error}`)
  }
}
