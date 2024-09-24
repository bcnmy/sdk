import {
  http,
  type Address,
  type Chain,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  parseEther
} from "viem"
import {
  type PaymasterClient,
  entryPoint07Address
} from "viem/account-abstraction"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../test/testSetup"
import { killNetwork } from "../../test/testUtils"
import type { NetworkConfig } from "../../test/testUtils"
import { type NexusAccount, toNexusAccount } from "../account/toNexusAccount"
import {
  type BicoBundlerClient,
  createBicoBundlerClient
} from "./createBicoBundlerClient"
import {
  biconomyPaymasterContext,
  createBicoPaymasterClient
} from "./createBicoPaymasterClient"
import { type NexusClient, createNexusClient } from "./createNexusClient"

// Remove the following lines to use the default factory and validator addresses
// These are relevant only for now on base sopelia chain and are likely to change
const k1ValidatorAddress = "0x663E709f60477f07885230E213b8149a7027239B"
const factoryAddress = "0x887Ca6FaFD62737D0E79A2b8Da41f0B15A864778"

describe.skip("bico.paymaster", async () => {
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
  let paymaster: PaymasterClient
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
      transport: http(),
      k1ValidatorAddress,
      factoryAddress
    })

    bicoBundler = createBicoBundlerClient({
      bundlerUrl,
      account: nexusAccount
    })
    nexusAccountAddress = await nexusAccount.getCounterFactualAddress()

    nexusClient = await createNexusClient({
      signer: account,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      k1ValidatorAddress,
      factoryAddress,
      paymaster
    })
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should call paymaster.getPaymasterData", async () => {
    const userOperation = await nexusClient.prepareUserOperation({
      calls: [{ to: recipientAddress, value: parseEther("1") }]
    })

    const paymasterData = await paymaster.getPaymasterData({
      chainId: chain.id,
      entryPointAddress: entryPoint07Address,
      ...userOperation,
      paymasterVerificationGasLimit: 20000n,
      paymasterPostOpGasLimit: 20000n
    })
  })

  test.skip("should have call getPaymasterStubData", async () => {
    const paymasterData = await paymaster.getPaymasterStubData({
      chainId: chain.id,
      entryPointAddress: entryPoint07Address,
      callData: "0x",
      nonce: 0n,
      sender: nexusAccountAddress,
      context: biconomyPaymasterContext
    })
  })

  test.skip("should send a transaction using the paymasterData", async () => {
    const hash = await nexusClient.sendTransaction({
      calls: [{ to: account.address, value: 1n }],
      verificationGasLimit: 1n,
      preVerificationGas: 1n,
      callGasLimit: 1n,
      maxFeePerGas: 1n,
      nonce: 0n
    })
    const { status, transactionHash } =
      await publicClient.waitForTransactionReceipt({ hash })

    expect(status).toBe("success")
  })
})
