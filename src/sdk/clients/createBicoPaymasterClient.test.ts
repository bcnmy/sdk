import {
  http,
  type Address,
  type Chain,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  parseAbi,
  parseUnits
} from "viem"
import { baseSepolia } from "viem/chains"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { paymasterTruthy, toNetwork } from "../../test/testSetup"
import { getTestParamsForTestnet, killNetwork } from "../../test/testUtils"
import type { NetworkConfig, TestnetParams } from "../../test/testUtils"
import { type NexusAccount, toNexusAccount } from "../account/toNexusAccount"
import {
  type BicoPaymasterClient,
  createBicoPaymasterClient
} from "./createBicoPaymasterClient"
import { type NexusClient, createNexusClient } from "./createNexusClient"

describe.runIf(paymasterTruthy())("bico.paymaster", async () => {
  let network: NetworkConfig
  // Required for "PUBLIC_TESTNET" networks
  let testParams: TestnetParams

  let chain: Chain
  let bundlerUrl: string
  let paymasterUrl: undefined | string
  let walletClient: WalletClient

  // Test utils
  let publicClient: PublicClient // testClient not available on public testnets
  let account: PrivateKeyAccount
  let recipientAddress: Address
  let nexusAccountAddress: Address
  let paymaster: BicoPaymasterClient
  let nexusAccount: NexusAccount
  let nexusClient: NexusClient

  const baseSepoliaUSDCAddress: Address =
    "0x036cbd53842c5426634e7929541ec2318f3dcf7e"
  const baseSepoliaDAIAddress: Address =
    "0x7683022d84f726a96c4a6611cd31dbf5409c0ac9"

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

    testParams = getTestParamsForTestnet(publicClient)

    paymaster = createBicoPaymasterClient({
      transport: http(paymasterUrl)
    })

    nexusAccount = await toNexusAccount({
      signer: account,
      chain,
      transport: http(),
      ...testParams
    })

    nexusAccountAddress = await nexusAccount.getCounterFactualAddress()

    nexusClient = (await createNexusClient({
      signer: account,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      paymaster,
      ...testParams
    })) as NexusClient
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should have paymaster actions", async () => {
    expect(paymaster).toHaveProperty("getPaymasterData")
    expect(paymaster.getPaymasterData).toBeInstanceOf(Function)

    // Bico Paymaster has no getPaymasterStubData method, to ensure latency is kept low.
    // expect(paymaster).not.toHaveProperty("getPaymasterStubData")
  })

  test("should send a sponsored transaction", async () => {
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

  test("should use token paymaster to pay for gas fees, use max approval", async () => {
    const nexusClient = await createNexusClient({
      signer: account,
      chain,
      paymaster: createBicoPaymasterClient({
        transport: http(paymasterUrl)
      }),
      paymasterContext: {
        mode: "ERC20",
        tokenInfo: {
          feeTokenAddress: baseSepoliaUSDCAddress
        }
      },
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      ...testParams
    })

    const initialBalance = await publicClient.getBalance({
      address: nexusAccountAddress
    })

    const hash = await nexusClient.sendTransaction({
      to: recipientAddress,
      value: 1n,
      chain: baseSepolia
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

  test("should use token paymaster to pay for gas fees, use custom approval with token paymaster quotes", async () => {
    const nexusClient = await createNexusClient({
      signer: account,
      chain,
      index: 3n,
      paymaster: createBicoPaymasterClient({
        transport: http(paymasterUrl)
      }),
      paymasterContext: {
        mode: "ERC20",
        tokenInfo: {
          feeTokenAddress: baseSepoliaUSDCAddress
        }
      },
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      ...testParams
    })

    const usdcBalance = await publicClient.readContract({
      address: baseSepoliaUSDCAddress,
      abi: parseAbi([
        "function balanceOf(address owner) public view returns (uint256 balance)"
      ]),
      functionName: "balanceOf",
      args: [nexusClient.account.address]
    })
    expect(usdcBalance).toBeGreaterThan(0n)

    const initialBalance = await publicClient.getBalance({
      address: nexusClient.account.address
    })

    const tokenList = [baseSepoliaUSDCAddress]
    const userOp = await nexusClient.prepareUserOperation({
      calls: [
        {
          to: recipientAddress,
          value: 1n,
          chain: baseSepolia
        }
      ]
    })
    const quote = await paymaster.getTokenPaymasterQuotes(userOp, tokenList)
    const usdcFeeAmount = parseUnits(
      quote.feeQuotes[0].maxGasFee.toString(),
      quote.feeQuotes[0].decimal
    )

    expect(usdcBalance).toBeGreaterThan(usdcFeeAmount)

    const hash = await nexusClient.sendTransaction(
      {
        to: recipientAddress,
        value: 1n,
        chain: baseSepolia
      },
      usdcFeeAmount
    )

    // Wait for the transaction to be mined
    const { status } = await nexusClient.waitForTransactionReceipt({ hash })
    expect(status).toBe("success")
    // Get final balance
    const finalBalance = await publicClient.getBalance({
      address: nexusClient.account.address
    })

    // Check that the balance hasn't changed
    // No gas fees were paid, so the balance should have decreased only by 1n
    expect(finalBalance).toBe(initialBalance - 1n)
  })

  test("should retrieve all supported token addresses from the token paymaster", async () => {
    const nexusClient = await createNexusClient({
      signer: account,
      chain,
      paymaster: createBicoPaymasterClient({
        transport: http(paymasterUrl)
      }),
      paymasterContext: {
        mode: "ERC20",
        tokenInfo: {
          feeTokenAddress: baseSepoliaUSDCAddress
        }
      },
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      ...testParams
    })

    const supportedTokens = await paymaster.getSupportedTokens(nexusClient)
    const supportedTokenAddresses = supportedTokens.map(
      (token) => token.tokenAddress
    )
    expect(supportedTokenAddresses).toContain(baseSepoliaUSDCAddress)
    expect(supportedTokenAddresses).toContain(baseSepoliaDAIAddress)
  })
})
