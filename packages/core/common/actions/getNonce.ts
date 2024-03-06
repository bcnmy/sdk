import type { Address, Client } from "viem"
import { readContract } from "viem/actions"
import { DEFAULT_ENTRYPOINT_ADDRESS } from "../utils/constants.js"

/**
 * Retrieves the nonce for a given sender address.
 * If a nonce key is provided, it will be used to specify the nonce space.
 * If no nonce key is provided, the default nonce space (0) will be used.
 *
 * @param client - The client object used to interact with the blockchain.
 * @param sender - The sender address for which to retrieve the nonce.
 * @param nonceKey - Optional nonce key to specify the nonce space.
 * @returns The nonce value as a bigint.
 */
export const getNonce = async (
  client: Client,
  sender: Address,
  nonceKey?: number
): Promise<bigint> => {
  const nonceSpace = nonceKey ?? 0
  try {
    return readContract(client, {
      address: DEFAULT_ENTRYPOINT_ADDRESS,
      abi: [
        {
          inputs: [
            {
              name: "sender",
              type: "address"
            },
            {
              name: "key",
              type: "uint192"
            }
          ],
          name: "getNonce",
          outputs: [
            {
              name: "nonce",
              type: "uint256"
            }
          ],
          stateMutability: "view",
          type: "function"
        }
      ],
      functionName: "getNonce",
      args: [sender, BigInt(nonceSpace)]
    })
  } catch (e) {
    return BigInt(0)
  }
}
