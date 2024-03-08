import {
  type Address,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  hexToBigInt,
  keccak256
} from "viem"
import type { Prettify } from "viem/chains"
import {
  BICONOMY_PROXY_CREATION_CODE,
  BiconomyInitAbi
} from "../../common/index.js"
import type { GetAccountAddressParams } from "../utils/types.js"

/**
 * Retrieves the counterfactual address for a new account.
 *
 * @param factoryAddress The address of the factory contract.
 * @param accountLogicAddress The address of the account logic contract.
 * @param fallbackHandlerAddress The address of the fallback handler contract.
 * @param validationModule The validation module for the account.
 * @param index The index of the account (optional, default is 0).
 * @returns The counterfactual address of the new account.
 * @throws Error if failed to get the counterfactual address.
 */
export const getAccountAddress = async ({
  factoryAddress,
  accountLogicAddress,
  fallbackHandlerAddress,
  validationModule,
  index = 0n
}: Prettify<GetAccountAddressParams>): Promise<Address> => {
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
