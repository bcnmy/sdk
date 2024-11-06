import { http, type Address, type Chain, type LocalAccount, isHex } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { danActions } from "."
import { toNetwork } from "../../../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  getBalance,
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp
} from "../../../../../test/testUtils"
import { type NexusClient, createNexusClient } from "../../../createNexusClient"

describe("modules.dan.decorators", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let nexusAccountAddress: Address
  let nexusClient: NexusClient
  let userTwo: LocalAccount
  let userThree: LocalAccount

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    userTwo = getTestAccount(1)
    userThree = getTestAccount(2)
    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await topUp(testClient, nexusAccountAddress)
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should send some native token", async () => {
    const balanceBefore = await testClient.getBalance({
      address: userThree.address
    })
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: userThree.address,
          value: 1n
        }
      ]
    })
    const { status } = await testClient.waitForTransactionReceipt({ hash })
    const balanceAfter = await testClient.getBalance({
      address: userThree.address
    })
    expect(status).toBe("success")
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  test("should test dan decorators", async () => {
    const balanceOfRecipient = await getBalance(testClient, userTwo.address)

    const danNexusClient = nexusClient.extend(danActions())
    const keyGenData = await danNexusClient.keyGen()

    const hash = await danNexusClient.sendTx({
      account: nexusClient.account,
      keyGenData,
      calls: [{ to: userTwo.address, value: 1n }]
    })

    const balanceOfRecipientAfter = await getBalance(
      testClient,
      userTwo.address
    )

    const { status } = await testClient.waitForTransactionReceipt({ hash })

    expect(balanceOfRecipientAfter - balanceOfRecipient).toBe(1n)
    expect(status).toBe("success")
  })
})
