import { http, type Chain } from "viem"
import {
  MEE_VALIDATOR_ADDRESS,
  NEXUS_ACCOUNT_FACTORY,
  TEMP_MEE_ATTESTER_ADDR
} from "../../constants"
import type { MinimalMEESmartAccount } from "../../modules/utils/Types"
import { toNexusAccount } from "../toNexusAccount"
import type { Signer } from "./toSigner"

/**
 * Parameters required to create a multichain Nexus account
 */
export type MultichainNexusParams = {
  /** The signer instance used for account creation */
  signer: Signer
  /** Array of chains where the account will be deployed */
  chains: Chain[]
}

/**
 * Represents a smart account deployed across multiple chains
 */
export type MultichainSmartAccount = {
  /** Array of minimal MEE smart account instances across different chains */
  deployments: MinimalMEESmartAccount[]
  /** The signer associated with this multichain account */
  signer: Signer
  /**
   * Function to retrieve deployment information for a specific chain
   * @param chainId - The ID of the chain to query
   * @returns The smart account deployment for the specified chain
   * @throws Error if no deployment exists for the specified chain
   */
  deploymentOn: (chainId: number) => MinimalMEESmartAccount
}

/**
 * Creates a multichain Nexus account across specified chains
 * @param parameters - Configuration parameters for multichain account creation
 * @returns Promise resolving to a MultichainSmartAccount instance
 */
export async function toMultichainNexusAccount(
  parameters: MultichainNexusParams
): Promise<MultichainSmartAccount> {
  const { signer, chains } = parameters

  const deployments = await Promise.all(
    chains.map((chain) =>
      toNexusAccount({
        chain,
        signer,
        transport: http(),
        validatorAddress: MEE_VALIDATOR_ADDRESS,
        factoryAddress: NEXUS_ACCOUNT_FACTORY,
        attesters: [TEMP_MEE_ATTESTER_ADDR]
      })
    )
  )

  const deploymentOn = (chainId: number) => {
    const deployment = deployments.find(
      (dep) => dep.client.chain?.id === chainId
    )
    if (!deployment) {
      throw Error(`No account deployment for chainId: ${chainId}`)
    }
    return deployment
  }

  return {
    deployments,
    signer,
    deploymentOn
  }
}
