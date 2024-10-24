import {
  http,
  type Address,
  type Chain,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { paymasterTruthy, toNetwork } from "../../test/testSetup"
import { getMainnetTestingParameters, killNetwork } from "../../test/testUtils"
import type { NetworkConfig } from "../../test/testUtils"
import { type NexusAccount, toNexusAccount } from "../account/toNexusAccount"
import {
  type BicoBundlerClient,
  createBicoBundlerClient
} from "./createBicoBundlerClient"
import {
  type BicoPaymasterClient,
  createBicoPaymasterClient
} from "./createBicoPaymasterClient"
import { type NexusClient, createNexusClient } from "./createNexusClient"

// Test will run only if process.env.PAYMASTER_URL is set
describe.runIf(paymasterTruthy)("bico.paymaster", async () => {
  let network: NetworkConfig
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let paymasterUrl: undefined | string
  let walletClient: WalletClient

  // Test utils
  let publicClient: PublicClient // testClient not available on public testnets
  let account: PrivateKeyAccount
  let recipientAddress: Address
  let bicoBundler: BicoBundlerClient
  let nexusAccountAddress: Address
  let paymaster: BicoPaymasterClient
  let nexusAccount: NexusAccount
  let nexusClient: NexusClient

  beforeAll(async () => {
    network = await toNetwork("PUBLIC_TESTNET")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    paymasterUrl = network.paymasterUrl
    account = network.account as PrivateKeyAccount

    recipientAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    publicClient = createPublicClient({
      chain,
      transport: http()
    })

    paymaster = createBicoPaymasterClient({
      transport: http(paymasterUrl)
    })

    nexusAccount = await toNexusAccount({
      signer: account,
      chain,
      transport: http()
    })

    bicoBundler = createBicoBundlerClient({
      bundlerUrl,
      chain,
      account: nexusAccount
    })
    nexusAccountAddress = await nexusAccount.getCounterFactualAddress()

    nexusClient = await createNexusClient({
      signer: account,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      paymaster,
      // For "PUBLIC_TESTNET" network
      ...getMainnetTestingParameters(publicClient)
    })
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should have paymaster actions", async () => {
    expect(paymaster).toHaveProperty("getPaymasterData")
    expect(paymaster.getPaymasterData).toBeInstanceOf(Function)

    // Bico Paymaster has no getPaymasterStubData method, to ensure latency is kept low.
    expect(paymaster).not.toHaveProperty("getPaymasterStubData")
  })

  // Test passes but for the sake of not spending testnet funds, we skip it.
  test.skip("should send a sponsored transaction", async () => {
    // Get initial balance
    const initialBalance = await publicClient.getBalance({
      address: nexusAccountAddress
    })

    // Send user operation
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        }
      ]
    })

    // Wait for the transaction to be mined
    const { status } = await publicClient.waitForTransactionReceipt({ hash })
    expect(status).toBe("success")
    // Get final balance
    const finalBalance = await publicClient.getBalance({
      address: nexusAccountAddress
    })
    // Check that the balance hasn't changed
    // No gas fees were paid, so the balance should have decreased only by 1n
    expect(finalBalance).toBe(initialBalance - 1n)
  })
})
