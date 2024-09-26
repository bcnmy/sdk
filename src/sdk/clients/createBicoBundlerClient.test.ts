import { http, type Account, type Address, type Chain, isHex } from "viem"
import type { BundlerClient } from "viem/account-abstraction"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../test/testSetup"
import {
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp
} from "../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../test/testUtils"
import contracts from "../__contracts"
import { type NexusAccount, toNexusAccount } from "../account/toNexusAccount"
import {
  type BicoBundlerClient,
  createBicoBundlerClient
} from "./createBicoBundlerClient"

describe("bico.bundler", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: Account
  let nexusAccountAddress: Address
  let bicoBundler: BicoBundlerClient
  let nexusAccount: NexusAccount

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    testClient = toTestClient(chain, getTestAccount(5))

    nexusAccount = await toNexusAccount({
      signer: eoaAccount,
      chain,
      transport: http()
    })

    bicoBundler = createBicoBundlerClient({ bundlerUrl, account: nexusAccount })
    nexusAccountAddress = await nexusAccount.getCounterFactualAddress()
    await topUp(testClient, nexusAccountAddress)
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test.concurrent("should have 4337 bundler actions", async () => {
    const [chainId, supportedEntrypoints, preparedUserOp] = await Promise.all([
      bicoBundler.getChainId(),
      bicoBundler.getSupportedEntryPoints(),
      bicoBundler.prepareUserOperation({
        sender: eoaAccount.address,
        nonce: 0n,
        data: "0x",
        signature: "0x",
        verificationGasLimit: 1n,
        preVerificationGas: 1n,
        callData: "0x",
        callGasLimit: 1n,
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 1n,
        account: nexusAccount
      })
    ])
    expect(chainId).toEqual(chain.id)
    expect(supportedEntrypoints).to.include(contracts.entryPoint.address)
    expect(preparedUserOp).toHaveProperty("signature")
  })

  test.concurrent(
    "should have been extended by biconomy specific actions",
    async () => {
      const gasFees = await bicoBundler.getGasFeeValues()
      expect(gasFees).toHaveProperty("fast")
      expect(gasFees).toHaveProperty("standard")
      expect(gasFees).toHaveProperty("slow")
      expect(gasFees.fast.maxFeePerGas).toBeGreaterThan(0n)
    }
  )

  test("should send a user operation and get the receipt", async () => {
    const calls = [{ to: eoaAccount.address, value: 1n }]
    // Must find gas fees before sending the user operation
    const gas = await testClient.estimateFeesPerGas()
    const hash = await bicoBundler.sendUserOperation({
      ...gas,
      calls,
      account: nexusAccount
    })
    const receipt = await bicoBundler.waitForUserOperationReceipt({ hash })
    expect(receipt.success).toBeTruthy()
  })
})
