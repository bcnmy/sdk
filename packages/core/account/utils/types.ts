import type { Hex, WalletClient } from "viem"
import type { BaseValidationModule } from "../../common/utils/types"

export type BiconomySmartAccountConfig = {
  /** Factory address of biconomy factory contract or some other contract you have deployed on chain */
  factoryAddress?: Hex
  /** Sender address: If you want to override the Signer address with some other address and get counterfactual address can use this to pass the EOA and get SA address */
  senderAddress?: Hex
  /** implementation of smart contract address or some other contract you have deployed and want to override */
  implementationAddress?: Hex
  /** defaultFallbackHandler: override the default fallback contract address */
  defaultFallbackHandler?: Hex
  /** rpcUrl: Rpc url, optional, we set default rpc url if not passed. */
  rpcUrl?: string // as good as Provider
  /** paymasterUrl: The paymasterUrl retrieved from the Biconomy dashboard */
  paymasterUrl?: string
  /** activeValidationModule: The active validation module. Will default to the defaultValidationModule */
  activeValidationModule?: BaseValidationModule
  /** the index of SA the EOA have generated and till which indexes the upgraded SA should scan */
  maxIndexForScan?: number
  walletClient: WalletClient
  bundlerUrl: string
  accountIndex?: number
}
