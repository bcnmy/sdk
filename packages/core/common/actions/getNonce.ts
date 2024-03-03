import type { Address, Client } from "viem"
import { readContract } from "viem/actions"
import { DEFAULT_ENTRYPOINT_ADDRESS } from "../utils/constants"

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
