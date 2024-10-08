import {
  http,
  type Account,
  type Address,
  type Chain,
  createWalletClient
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../test/testSetup"
import { getTestAccount, killNetwork, toTestClient } from "../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../test/testUtils"
import type { NexusClient } from "./createNexusClient"
import { createNexusSessionClient } from "./createNexusSessionClient"

describe("nexus.client", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: Account
  let recipientAccount: Account
  let recipientAddress: Address
  let nexusSessionClient: NexusClient

  const dummyAddress = "0xf0479e036343bC66dc49dd374aFAF98402D0Ae5f"

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    recipientAccount = getTestAccount(1)
    recipientAddress = recipientAccount.address

    testClient = toTestClient(chain, getTestAccount(5))

    const sessionClient = await createWalletClient({
      account: eoaAccount,
      chain,
      transport: http()
    })

    nexusSessionClient = await createNexusSessionClient({
      chain,
      client: sessionClient,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      sessionKeyEOA: eoaAccount.address,
      permissionId: "0x123",
      bundlerUrl,
      accountAddress: dummyAddress
    })
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should match account address", async () => {
    const accountAddress = await nexusSessionClient.account.getAddress()
    expect(accountAddress).toBe(dummyAddress)
  })
})
