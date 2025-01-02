import {
  http,
  type Account,
  type Address,
  type Chain,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient
} from "viem"
import { beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../test/testSetup"
import { getTestParamsForTestnet } from "../../test/testUtils"
import type { NetworkConfig, TestnetParams } from "../../test/testUtils"
import { type NexusAccount, toNexusAccount } from "../account/toNexusAccount"
import { ENTRY_POINT_ADDRESS } from "../constants"
import {
  type NexusClient,
  createSmartAccountClient
} from "./createSmartAccountClient"

describe("bico.bundler", async () => {
  let network: NetworkConfig
  // Required for "TESTNET_FROM_ENV_VARS" networks
  let testnetParams: TestnetParams

  let chain: Chain
  let bundlerUrl: string
  let paymasterUrl: undefined | string
  let walletClient: WalletClient

  // Test utils
  let publicClient: PublicClient // testClient not available on public testnets
  let account: PrivateKeyAccount
  let recipientAddress: Address
  let nexusAccountAddress: Address
  let nexusAccount: NexusAccount
  let nexusClient: NexusClient

  beforeAll(async () => {
    network = await toNetwork("TESTNET_FROM_ENV_VARS")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
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

    testnetParams = getTestParamsForTestnet(publicClient)

    nexusAccount = await toNexusAccount({
      signer: account,
      chain,
      transport: http(),
      ...testnetParams
    })

    nexusAccountAddress = await nexusAccount.getCounterFactualAddress()

    nexusClient = await createSmartAccountClient({
      signer: account,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      ...testnetParams
    })
  })

  test.concurrent("should have 4337 bundler actions", async () => {
    const [chainId, supportedEntrypoints, preparedUserOp] = await Promise.all([
      nexusClient.getChainId(),
      nexusClient.getSupportedEntryPoints(),
      nexusClient.prepareUserOperation({
        account: nexusAccount,
        calls: [{ to: account.address, data: "0x" }]
      })
    ])
    expect(chainId).toEqual(chain.id)
    expect(supportedEntrypoints).to.include(ENTRY_POINT_ADDRESS)
    expect(preparedUserOp).toHaveProperty("signature")
  })

  test.concurrent(
    "should have been extended by biconomy specific actions",
    async () => {
      const gasFees = await nexusClient.getGasFeeValues()
      expect(gasFees).toHaveProperty("fast")
      expect(gasFees).toHaveProperty("standard")
      expect(gasFees).toHaveProperty("slow")
      expect(gasFees.fast.maxFeePerGas).toBeGreaterThan(0n)
    }
  )

  test("should send a user operation and get the receipt", async () => {
    const calls = [{ to: account.address, value: 1n }]
    // Must find gas fees before sending the user operation
    const gas = await nexusClient.getGasFeeValues()
    const hash = await nexusClient.sendUserOperation({
      ...gas,
      calls,
      account: nexusAccount
    })
    const receipt = await nexusClient.waitForUserOperationReceipt({ hash })
    expect(receipt.success).toBeTruthy()
  })
})
