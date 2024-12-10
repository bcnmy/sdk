import { config } from "dotenv"
import getPort from "get-port"
// @ts-ignore
import { type AnvilParameters, alto, anvil } from "prool/instances"
import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PrivateKeyAccount,
  type PublicClient,
  createPublicClient,
  createTestClient,
  createWalletClient,
  parseAbi,
  publicActions,
  walletActions,
  zeroAddress
} from "viem"
import { createBundlerClient } from "viem/account-abstraction"
import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts"
import { getChain, getCustomChain, safeMultiplier } from "../sdk/account/utils"
import { Logger } from "../sdk/account/utils/Logger"
import {
  type NexusClient,
  createNexusClient
} from "../sdk/clients/createNexusClient"
import {
  ENTRYPOINT_SIMULATIONS_ADDRESS,
  ENTRY_POINT_ADDRESS,
  MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS,
  MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
} from "../sdk/constants"
import {
  ENTRY_POINT_SIMULATIONS_CREATECALL,
  ENTRY_POINT_V07_CREATECALL,
  TEST_CONTRACTS
} from "./callDatas"

import * as hardhatExec from "./executables"

config()

type AnvilInstance = ReturnType<typeof anvil>
type BundlerInstance = ReturnType<typeof alto>
type BundlerDto = {
  bundlerInstance: BundlerInstance
  bundlerUrl: string
  bundlerPort: number
}
export type AnvilDto = {
  rpcUrl: string
  rpcPort: number
  chain: Chain
  instance: AnvilInstance
}
export type NetworkConfigWithBundler = AnvilDto & BundlerDto
export type NetworkConfig = Omit<
  NetworkConfigWithBundler,
  "instance" | "bundlerInstance"
> & {
  account?: PrivateKeyAccount
  paymasterUrl?: string
}
export const pKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // This is a publicly available private key meant only for testing only

export const getTestAccount = (
  addressIndex = 0
): ReturnType<typeof mnemonicToAccount> => {
  return mnemonicToAccount(
    "test test test test test test test test test test test junk",
    {
      addressIndex
    }
  )
}

const allInstances = new Map<number, AnvilInstance>()

export const killAllNetworks = () =>
  killNetwork(Array.from(allInstances.keys()))

export const killNetwork = (ids: number[]) =>
  Promise.all(
    ids.map(async (id) => {
      const instance = allInstances.get(id)
      if (instance) {
        await instance.stop()
        allInstances.delete(id)
      }
    })
  )

export const initTestnetNetwork = async (): Promise<NetworkConfig> => {
  const privateKey = process.env.PRIVATE_KEY
  const chainId = process.env.CHAIN_ID
  const rpcUrl = process.env.RPC_URL //Optional, taken from chain (using chainId) if not provided
  const _bundlerUrl = process.env.BUNDLER_URL // Optional, taken from chain (using chainId) if not provided
  const paymasterUrl = process.env.PAYMASTER_URL // Optional

  let chain: Chain

  if (!privateKey) throw new Error("Missing env var PRIVATE_KEY")
  if (!chainId) throw new Error("Missing env var CHAIN_ID")
  if (!paymasterUrl) console.log("Missing env var PAYMASTER_URL")

  try {
    chain = getChain(+chainId)
  } catch (e) {
    if (!rpcUrl) throw new Error("Missing env var RPC_URL")
    chain = getCustomChain("Custom Chain", +chainId, rpcUrl)
  }
  const bundlerUrl = _bundlerUrl ?? getBundlerUrl(+chainId)

  const holder = privateKeyToAccount(
    privateKey?.startsWith("0x") ? (privateKey as Hex) : `0x${privateKey}`
  )

  return {
    rpcUrl: chain.rpcUrls.default.http[0],
    rpcPort: 0,
    chain,
    bundlerUrl,
    paymasterUrl,
    bundlerPort: 0,
    account: holder
  }
}

export const initLocalhostNetwork = async (
  shouldForkBaseSepolia = false
): Promise<NetworkConfigWithBundler> => {
  const configuredNetwork = await initAnvilPayload(shouldForkBaseSepolia)
  const bundlerConfig = await initBundlerInstance({
    rpcUrl: configuredNetwork.rpcUrl
  })
  await ensureBundlerIsReady(
    bundlerConfig.bundlerUrl,
    getTestChainFromPort(configuredNetwork.rpcPort)
  )
  allInstances.set(configuredNetwork.instance.port, configuredNetwork.instance)
  allInstances.set(
    bundlerConfig.bundlerInstance.port,
    bundlerConfig.bundlerInstance
  )
  return { ...configuredNetwork, ...bundlerConfig }
}

export type MasterClient = ReturnType<typeof toTestClient>
export const toTestClient = (chain: Chain, account: Account) =>
  createTestClient({
    mode: "anvil",
    chain,
    account,
    transport: http()
  })
    .extend(publicActions)
    .extend(walletActions)

export const toBundlerInstance = async ({
  rpcUrl,
  bundlerPort
}: {
  rpcUrl: string
  bundlerPort: number
}): Promise<BundlerInstance> => {
  const instance = alto({
    entrypoints: [ENTRY_POINT_ADDRESS],
    rpcUrl: rpcUrl,
    executorPrivateKeys: [pKey],
    entrypointSimulationContract: ENTRYPOINT_SIMULATIONS_ADDRESS,
    safeMode: false,
    port: bundlerPort
  })
  await instance.start()
  return instance
}

export const ensureBundlerIsReady = async (
  bundlerUrl: string,
  chain: Chain
) => {
  const bundler = await createBundlerClient({
    chain,
    transport: http(bundlerUrl)
  })

  while (true) {
    try {
      await bundler.getChainId()
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

export const toConfiguredAnvil = async ({
  rpcPort,
  shouldForkBaseSepolia = false
}: {
  rpcPort: number
  shouldForkBaseSepolia: boolean
}): Promise<AnvilInstance> => {
  const config: AnvilParameters = {
    hardfork: "Cancun",
    chainId: rpcPort,
    port: rpcPort,
    codeSizeLimit: 1000000000000,
    forkUrl: shouldForkBaseSepolia
      ? "https://virtual.base-sepolia.rpc.tenderly.co/42d65eaa-5a3b-46d5-8b51-814f4a5661d0"
      : undefined
  }
  const instance = anvil(config)
  await instance.start()
  await initDeployments(rpcPort)
  return instance
}

export const initDeployments = async (rpcPort: number) => {
  // Hardhat deployment of nexus repo:
  console.log(
    `using hardhat to deploy nexus contracts to http://localhost:${rpcPort}`
  )
  await hardhatExec.init()
  await hardhatExec.deploy(rpcPort)
  console.log("hardhat deployment complete.")

  // Hardcoded bytecode deployment of contracts using setCode:
  console.log("setting bytecode with hardcoded calldata.")
  const chain = getTestChainFromPort(rpcPort)
  const account = getTestAccount()
  const testClient = toTestClient(chain, account)

  // Dynamic bytecode deployment of contracts using setCode:
  console.log("setting bytecode with dynamic calldata from a testnet")
  await setByteCodeHardcoded(testClient)
  await setByteCodeDynamic(testClient, TEST_CONTRACTS)

  console.log("bytecode deployment complete.")
  console.log("")
}

const portOptions = { exclude: [] as number[] }
export const initAnvilPayload = async (
  shouldForkBaseSepolia = false
): Promise<AnvilDto> => {
  const rpcPort = await getPort(portOptions)
  portOptions.exclude.push(rpcPort)
  const rpcUrl = `http://localhost:${rpcPort}`
  const chain = getTestChainFromPort(rpcPort)
  const instance = await toConfiguredAnvil({ rpcPort, shouldForkBaseSepolia })
  return { rpcUrl, chain, instance, rpcPort }
}

export const initBundlerInstance = async ({
  rpcUrl
}: { rpcUrl: string }): Promise<BundlerDto> => {
  const bundlerPort = await getPort(portOptions)
  portOptions.exclude.push(bundlerPort)
  const bundlerUrl = `http://localhost:${bundlerPort}`
  const bundlerInstance = await toBundlerInstance({ rpcUrl, bundlerPort })
  return { bundlerInstance, bundlerUrl, bundlerPort }
}
export const getBalance = (
  testClient: MasterClient,
  owner: Hex,
  tokenAddress?: Hex
): Promise<bigint> => {
  if (!tokenAddress) {
    return testClient.getBalance({ address: owner })
  }
  return testClient.readContract({
    address: tokenAddress,
    abi: parseAbi([
      "function balanceOf(address owner) public view returns (uint256 balance)"
    ]),
    functionName: "balanceOf",
    args: [owner]
  }) as Promise<bigint>
}

export const nonZeroBalance = async (
  testClient: MasterClient,
  address: Hex,
  tokenAddress?: Hex
) => {
  const balance = await getBalance(testClient, address, tokenAddress)
  if (balance > BigInt(0)) return
  throw new Error(
    `Insufficient balance ${
      tokenAddress ? `of token ${tokenAddress}` : "of native token"
    } during test setup of owner: ${address}`
  )
}

export type FundedTestClients = Awaited<ReturnType<typeof toFundedTestClients>>
export const toFundedTestClients = async ({
  chain,
  bundlerUrl
}: { chain: Chain; bundlerUrl: string }) => {
  const account = getTestAccount(2)
  const recipientAccount = getTestAccount(3)

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  })

  const recipientWalletClient = createWalletClient({
    account: recipientAccount,
    chain,
    transport: http()
  })

  const testClient = toTestClient(chain, getTestAccount())

  const nexus = await createNexusClient({
    signer: account,
    transport: http(),
    bundlerTransport: http(bundlerUrl),
    chain
  })

  const smartAccountAddress = await nexus.account.getAddress()
  await fundAndDeployClients(testClient, [nexus])

  return {
    account,
    recipientAccount,
    walletClient,
    recipientWalletClient,
    testClient,
    nexus,
    smartAccountAddress
  }
}

export const fundAndDeployClients = async (
  testClient: MasterClient,
  nexusClients: NexusClient[]
) => {
  return await Promise.all(
    nexusClients.map((nexusClient) =>
      fundAndDeploySingleClient(testClient, nexusClient)
    )
  )
}

export const fundAndDeploySingleClient = async (
  testClient: MasterClient,
  nexusClient: NexusClient
) => {
  try {
    const accountAddress = await nexusClient.account.getAddress()
    await topUp(testClient, accountAddress)

    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: zeroAddress,
          value: 0n
        }
      ]
    })
    const { status, transactionHash } =
      await testClient.waitForTransactionReceipt({
        hash
      })

    if (status !== "success") {
      throw new Error("Failed to deploy smart account")
    }
    return transactionHash
  } catch (e) {
    console.error(`Error initializing smart account: ${e}`)
    return Promise.resolve()
  }
}

export const safeTopUp = async (
  testClient: MasterClient,
  recipient: Hex,
  amount = 100000000000000000000n,
  token?: Hex
) => {
  try {
    return await topUp(testClient, recipient, amount, token)
  } catch (error) {}
}

export const topUp = async (
  testClient: MasterClient,
  recipient: Hex,
  amount = 100000000000000000000n,
  token?: Hex
) => {
  const balanceOfRecipient = await getBalance(testClient, recipient, token)

  if (balanceOfRecipient > amount) {
    Logger.log(
      `balanceOfRecipient (${recipient}) already has enough ${
        token ?? "native token"
      } (${balanceOfRecipient}) during safeTopUp`
    )
    return await Promise.resolve()
  }

  if (token) {
    const hash = await testClient.writeContract({
      address: token,
      abi: parseAbi([
        "function transfer(address recipient, uint256 amount) external"
      ]),
      functionName: "transfer",
      args: [recipient, amount]
    })
    return await testClient.waitForTransactionReceipt({ hash })
  }
  const hash = await testClient.sendTransaction({
    to: recipient,
    value: amount
  })
  return await testClient.waitForTransactionReceipt({ hash })
}

export const getBundlerUrl = (chainId: number) =>
  `https://bundler.biconomy.io/api/v3/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14`

const getTestChainFromPort = (port: number): Chain =>
  getCustomChain(`Anvil-${port}`, port, `http://localhost:${port}`, "")

const setByteCodeHardcoded = async (
  testClient: MasterClient
): Promise<void> => {
  const DETERMINISTIC_DEPLOYER = "0x4e59b44847b379578588920ca78fbf26c0b4956c"

  const entrypointSimulationHash = await testClient.sendTransaction({
    to: DETERMINISTIC_DEPLOYER,
    data: ENTRY_POINT_SIMULATIONS_CREATECALL,
    gas: 15_000_000n
  })

  const entrypointHash = await testClient.sendTransaction({
    to: DETERMINISTIC_DEPLOYER,
    data: ENTRY_POINT_V07_CREATECALL,
    gas: 15_000_000n
  })

  await Promise.all([
    testClient.waitForTransactionReceipt({ hash: entrypointSimulationHash }),
    testClient.waitForTransactionReceipt({ hash: entrypointHash })
  ])
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export type DeployerParams = {
  name?: string
  chainId: number
  address: Address
}
export const setByteCodeDynamic = async (
  testClient: MasterClient,
  deployParams: Record<string, DeployerParams>
) => {
  const deployParamsArray = Object.values(deployParams)

  const bytecodes = (await Promise.all(
    deployParamsArray.map(({ chainId, address }) => {
      const fetchChain = getChain(chainId)
      const publicClient = createPublicClient({
        chain: fetchChain,
        transport: http()
      })
      return publicClient.getCode({ address })
    })
  )) as Hex[]

  await Promise.all(
    deployParamsArray.map(({ address }, index) =>
      testClient.setCode({
        bytecode: bytecodes[index],
        address
      })
    )
  )
}

export type TestnetParams = ReturnType<typeof getTestParamsForTestnet>
export const getTestParamsForTestnet = (publicClient: PublicClient) => ({
  k1ValidatorAddress: MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS,
  factoryAddress: MAINNET_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
  // userOperation: {
  //   estimateFeesPerGas: async (_) => {
  //     const feeData = await publicClient.estimateFeesPerGas()
  //     return {
  //       maxFeePerGas: safeMultiplier(feeData.maxFeePerGas, 1.5),
  //       maxPriorityFeePerGas: safeMultiplier(feeData.maxPriorityFeePerGas, 1.5)
  //     }
  //   }
  // }
})
