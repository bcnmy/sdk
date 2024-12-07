import { inject, test } from "vitest"
import {
  type FundedTestClients,
  type NetworkConfig,
  type NetworkConfigWithBundler,
  initLocalhostNetwork,
  initTestnetNetwork,
  toFundedTestClients
} from "./testUtils"

export type NetworkConfigWithTestClients = NetworkConfigWithBundler & {
  fundedTestClients: FundedTestClients
}

export const localhostTest = test.extend<{
  config: NetworkConfigWithTestClients
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Needed in vitest :/
  config: async ({}, use) => {
    const testNetwork = await initLocalhostNetwork()
    const fundedTestClients = await toFundedTestClients({
      chain: testNetwork.chain,
      bundlerUrl: testNetwork.bundlerUrl
    })
    await use({ ...testNetwork, fundedTestClients })
    await Promise.all([
      testNetwork.instance.stop(),
      testNetwork.bundlerInstance.stop()
    ])
  }
})

export const testnetTest = test.extend<{
  config: NetworkConfig
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Needed in vitest :/
  config: async ({}, use) => {
    const testNetwork = await toNetwork("TESTNET_FROM_ENV_VARS")
    await use(testNetwork)
  }
})

export type TestFileNetworkType =
  | "BESPOKE_ANVIL_NETWORK"
  | "BESPOKE_ANVIL_NETWORK_FORKING_BASE_SEPOLIA"
  | "TESTNET_FROM_ENV_VARS"
  | "TESTNET_FROM_ALT_ENV_VARS"
  | "COMMUNAL_ANVIL_NETWORK"

export const toNetworks = async (
  networkTypes_: TestFileNetworkType | TestFileNetworkType[] = [
    "BESPOKE_ANVIL_NETWORK"
  ]
): Promise<NetworkConfig[]> => {
  const networkTypes = Array.isArray(networkTypes_)
    ? networkTypes_
    : [networkTypes_]

  return await Promise.all(networkTypes.map((type) => toNetwork(type)))
}

export const toNetwork = async (
  networkType: TestFileNetworkType = "BESPOKE_ANVIL_NETWORK"
): Promise<NetworkConfig> => {
  const forkBaseSepolia =
    networkType === "BESPOKE_ANVIL_NETWORK_FORKING_BASE_SEPOLIA"
  const communalAnvil = networkType === "COMMUNAL_ANVIL_NETWORK"
  const testNet = [
    "TESTNET_FROM_ENV_VARS",
    "TESTNET_FROM_ALT_ENV_VARS"
  ].includes(networkType)

  return await (communalAnvil
    ? // @ts-ignore
      inject("globalNetwork")
    : testNet
      ? initTestnetNetwork(networkType)
      : initLocalhostNetwork(forkBaseSepolia))
}

export const paymasterTruthy = () => {
  try {
    return !!process.env.PAYMASTER_URL
  } catch (e) {
    return false
  }
}
