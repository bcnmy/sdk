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
    const testNetwork = await toNetwork("PUBLIC_TESTNET")
    await use(testNetwork)
  }
})

export type TestFileNetworkType =
  | "FILE_LOCALHOST"
  | "COMMON_LOCALHOST"
  | "PUBLIC_TESTNET"
  | "BASE_SEPOLIA_FORKED"

export const toNetwork = async (
  networkType: TestFileNetworkType = "FILE_LOCALHOST"
): Promise<NetworkConfig> => {
  const forkBaseSepolia = networkType === "BASE_SEPOLIA_FORKED"
  return await (networkType === "COMMON_LOCALHOST"
    ? // @ts-ignore
      inject("globalNetwork")
    : networkType === "PUBLIC_TESTNET"
      ? initTestnetNetwork()
      : initLocalhostNetwork(forkBaseSepolia))
}

export const paymasterTruthy = () => {
  try {
    return !!process.env.PAYMASTER_URL
  } catch (e) {
    return false
  }
}
