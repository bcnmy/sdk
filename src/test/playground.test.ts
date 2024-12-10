import {
  http,
  type Address,
  type Chain,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  erc20Abi
} from "viem"
import { beforeAll, describe, expect, test } from "vitest"
import { playgroundTrue } from "../sdk/account/utils/Utils"
import { createBicoPaymasterClient } from "../sdk/clients/createBicoPaymasterClient"
import {
  type NexusClient,
  createNexusClient
} from "../sdk/clients/createNexusClient"
import { toNetwork } from "./testSetup"
import {
  type NetworkConfig,
  type TestnetParams,
  getTestParamsForTestnet
} from "./testUtils"

describe.skipIf(!playgroundTrue())("playground", () => {
  let network: NetworkConfig
  // Required for "PUBLIC_TESTNET" networks
  let testParams: TestnetParams
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let walletClient: WalletClient
  let paymasterUrl: string

  // Test utils
  let publicClient: PublicClient // testClient not available on public testnets
  let eoaAccount: PrivateKeyAccount
  let recipientAddress: Address
  let nexusClient: NexusClient

  beforeAll(async () => {
    network = await toNetwork("PUBLIC_TESTNET")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    paymasterUrl = network.paymasterUrl || ""
    eoaAccount = network.account as PrivateKeyAccount

    recipientAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth

    walletClient = createWalletClient({
      account: eoaAccount,
      chain,
      transport: http()
    })

    publicClient = createPublicClient({
      chain,
      transport: http()
    })

    testParams = getTestParamsForTestnet(publicClient)
  })

  test("should send a token paymaster user op", async () => {
    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      paymaster: createBicoPaymasterClient({
        paymasterUrl
      }),
      paymasterContext: {
        mode: "ERC20",
        tokenInfo: {
          feeTokenAddress: "0x036cbd53842c5426634e7929541ec2318f3dcf7e" // USDC Base Sepolia (default if not provided)
        }
      },
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      ...testParams
    })

    const txHash = await nexusClient.sendTransaction({
      calls: [
        {
          to: "0x036cbd53842c5426634e7929541ec2318f3dcf7e",
          value: 0n,
          data: "0x"
        }
      ]
    })

    const receipt = await nexusClient.waitForTransactionReceipt({
      hash: txHash
    })

    expect(receipt.status).toBe("success")
  })

  test("should get quotes for token paymaster sponsored user op", async () => {
    const paymasterClient = createBicoPaymasterClient({
      paymasterUrl
    })
    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      paymaster: paymasterClient,
      paymasterContext: {
        mode: "ERC20"
      },
      ...testParams
    })

    const userOp = await nexusClient.prepareUserOperation({
      calls: [
        {
          to: "0x036cbd53842c5426634e7929541ec2318f3dcf7e",
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: ["0x9C7BAEcAD667FD58331BEd9D5984Df03A78b87Bc", 10000000n]
          })
        }
      ]
    })

    const quotes = await paymasterClient.getPaymasterQuotes(userOp, [
      "0x036cbd53842c5426634e7929541ec2318f3dcf7e"
    ])
    const usdcQuote = quotes.feeQuotes.find(
      (quote: any) =>
        quote.tokenAddress === "0x036cbd53842c5426634e7929541ec2318f3dcf7e"
    )
    expect(usdcQuote).toBeDefined()
    expect(usdcQuote?.decimal).toBe(6)
    expect(usdcQuote?.tokenAddress).toBe(
      "0x036cbd53842c5426634e7929541ec2318f3dcf7e"
    )
  })
})
