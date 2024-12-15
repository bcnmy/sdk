import { http, type Address, type OneOf, type Transport } from "viem"
import {
  type PaymasterClient,
  type PaymasterClientConfig,
  createPaymasterClient
} from "viem/account-abstraction"
import {
  type TokenPaymasterActions,
  bicoTokenPaymasterActions
} from "./decorators/tokenPaymaster"

export type BicoPaymasterClient = Omit<
  PaymasterClient,
  "getPaymasterStubData"
> &
  TokenPaymasterActions

/**
 * Configuration options for creating a Bico Paymaster Client.
 * @typedef {Object} BicoPaymasterClientConfig
 * @property {Transport} [transport] - Optional custom transport.
 * @property {string} [paymasterUrl] - URL of the paymaster service.
 * @property {number} [chainId] - Chain ID for the network.
 * @property {string} [apiKey] - API key for authentication.
 */
type BicoPaymasterClientConfig = Omit<PaymasterClientConfig, "transport"> &
  OneOf<
    | {
        transport?: Transport
      }
    | {
        paymasterUrl: string
      }
    | {
        chainId: number
        apiKey: string
      }
  >

/**
 * Context for the Bico SPONSORED Paymaster.
 */
export type PaymasterContext = {
  mode: "ERC20" | "SPONSORED"
  sponsorshipInfo?: {
    smartAccountInfo: {
      name: string
      version: string
    }
  }
  tokenInfo: {
    feeTokenAddress: Address
  }
  expiryDuration?: number
  calculateGasLimits?: boolean
}

type ToBiconomyTokenPaymasterContextParams = {
  feeTokenAddress: Address
}

export const biconomySponsoredPaymasterContext = {
  mode: "SPONSORED",
  expiryDuration: 300,
  calculateGasLimits: true,
  sponsorshipInfo: {
    smartAccountInfo: {
      name: "BICONOMY",
      version: "1.0.0"
    }
  }
}

export const toBiconomyTokenPaymasterContext = ({
  feeTokenAddress
}: ToBiconomyTokenPaymasterContextParams): PaymasterContext => {
  return {
    mode: "ERC20",
    tokenInfo: {
      feeTokenAddress
    }
  }
}

/**
 * Creates a Bico Paymaster Client.
 *
 * This function sets up a client for interacting with Biconomy's paymaster service.
 * It can be configured with a custom transport, a specific paymaster URL, or with a chain ID and API key.
 *
 * @param {BicoPaymasterClientConfig} parameters - Configuration options for the client.
 * @returns {PaymasterClient} A configured Paymaster Client instance.
 *
 * @example
 * // Create a client with a custom transport
 * const client1 = createBicoPaymasterClient({ transport: customTransport })
 *
 * @example
 * // Create a client with a specific paymaster URL
 * const client2 = createBicoPaymasterClient({ paymasterUrl: 'https://example.com/paymaster' })
 *
 * @example
 * // Create a client with chain ID and API key
 * const client3 = createBicoPaymasterClient({ chainId: 1, apiKey: 'your-api-key' })
 *
 * @example
 * // Create a Token Paymaster Client
 * const tokenPaymasterClient = createBicoPaymasterClient({
 *      paymasterUrl: 'https://example.com/paymaster',
 *      paymasterContext: {
 *        mode: "ERC20",
 *        tokenInfo: {
 *          feeTokenAddress: "0x..."
 *        }
 *      },
 * })
 */
export const createBicoPaymasterClient = (
  parameters: BicoPaymasterClientConfig
): BicoPaymasterClient => {
  const defaultedTransport = parameters.transport
    ? parameters.transport
    : parameters.paymasterUrl
      ? http(parameters.paymasterUrl)
      : http(
          `https://paymaster.biconomy.io/api/v2/${parameters.chainId}/${parameters.apiKey}`
        )

  // Remove getPaymasterStubData from the client.
  const { getPaymasterStubData, ...paymasterClient } = createPaymasterClient({
    ...parameters,
    transport: defaultedTransport
  })

  return paymasterClient.extend(bicoTokenPaymasterActions())
}
