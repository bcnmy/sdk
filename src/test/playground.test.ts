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

describe.skipIf(!playgroundTrue)("playground", () => {
  let network: NetworkConfig
  // Required for "PUBLIC_TESTNET" networks
  let testParams: TestnetParams
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let walletClient: WalletClient

  // Test utils
  let publicClient: PublicClient // testClient not available on public testnets
  let eoaAccount: PrivateKeyAccount
  let recipientAddress: Address
  let nexusClient: NexusClient
  let nexusAccountAddress: Address

  beforeAll(async () => {
    network = await toNetwork("PUBLIC_TESTNET")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
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

  test("should init the smart account", async () => {
    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      paymaster: network.paymasterUrl
        ? createBicoPaymasterClient({
            transport: http(network.paymasterUrl)
          })
        : undefined,
      ...testParams
    })
  })

  test("should log relevant addresses", async () => {
    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    console.log({ nexusAccountAddress })
  })

  test("should check balances and top up relevant addresses", async () => {
    const [ownerBalance, smartAccountBalance] = await Promise.all([
      publicClient.getBalance({
        address: eoaAccount.address
      }),
      publicClient.getBalance({
        address: nexusAccountAddress
      })
    ])

    const balancesAreOfCorrectType = [ownerBalance, smartAccountBalance].every(
      (balance) => typeof balance === "bigint"
    )
    if (smartAccountBalance === 0n) {
      const hash = await walletClient.sendTransaction({
        chain,
        account: eoaAccount,
        to: nexusAccountAddress,
        value: 1000000000000000000n
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
    }
    expect(balancesAreOfCorrectType).toBeTruthy()
  })

  test("should send some native token", async () => {
    const balanceBefore = await publicClient.getBalance({
      address: recipientAddress
    })
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        }
      ]
    })
    const { status } = await publicClient.waitForTransactionReceipt({ hash })
    const balanceAfter = await publicClient.getBalance({
      address: recipientAddress
    })
    expect(status).toBe("success")
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  test("should send a user operation using nexusClient.sendUserOperation", async () => {
    const balanceBefore = await publicClient.getBalance({
      address: recipientAddress
    })
    const userOpHash = await nexusClient.sendUserOperation({
      calls: [{ to: recipientAddress, value: 1n }]
    })
    const { success } = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })
    const balanceAfter = await publicClient.getBalance({
      address: recipientAddress
    })
    expect(success).toBe("true")
    expect(balanceAfter - balanceBefore).toBe(1n)
  })
})
