import type { Address } from "viem"
import type { PublicClient } from "viem"
import {
  MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS,
  RHINESTONE_ATTESTER_ADDRESS
} from "../../constants"

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
export const getCounterFactualAddress = async (
  publicClient: PublicClient,
  signerAddress: Address,
  index = 0n,
  attesters = [RHINESTONE_ATTESTER_ADDRESS],
  threshold = 1,
  factoryAddress = MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
) => {
  return await publicClient.readContract({
    address: factoryAddress,
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "eoaOwner",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "index",
            type: "uint256"
          },
          {
            internalType: "address[]",
            name: "attesters",
            type: "address[]"
          },
          {
            internalType: "uint8",
            name: "threshold",
            type: "uint8"
          }
        ],
        name: "computeAccountAddress",
        outputs: [
          {
            internalType: "address payable",
            name: "expectedAddress",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: "computeAccountAddress",
    args: [signerAddress, index, attesters, threshold]
  })
}
