import { http, type Chain, type LocalAccount } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { danActions } from "."
import { toNetwork } from "../../../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../../../test/testUtils"
import {
  parse,
  stringify
} from "../../../../modules/smartSessionsValidator/Helpers"
import { type NexusClient, createNexusClient } from "../../../createNexusClient"
import type { KeyGenData } from "./keyGen"

describe("DAN (Distributed Account Network) Demonstration", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let userTwo: LocalAccount
  let nexusClient: NexusClient
  let storedKeyData: string // Will store serialized key data

  beforeAll(async () => {
    network = await toNetwork()
    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    userTwo = getTestAccount(1)
    testClient = toTestClient(chain, getTestAccount(5))
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should demonstrate key generation and storage", async () => {
    /**
     * This test demonstrates:
     * 1. Generating DAN keys
     * 2. Storing the key data for later use
     *
     * This simulates a user generating keys and storing them
     * for use in a later session.
     */

    // Create and setup Nexus client
    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })
    await fundAndDeployClients(testClient, [nexusClient])

    // Extend client with DAN actions
    const danNexusClient = nexusClient.extend(danActions())

    // Generate keys for DAN operations
    const keyGenData = await danNexusClient.keyGen()

    // Store the key data as a string for later use
    // This could be saved to localStorage, a database, etc.
    storedKeyData = stringify(keyGenData)

    expect(storedKeyData).toBeDefined()
    expect(typeof storedKeyData).toBe("string")
  })

  test("should demonstrate using stored keys for transactions", async () => {
    /**
     * This test demonstrates:
     * 1. Retrieving stored key data
     * 2. Using the keys to send a transaction
     *
     * This simulates a user returning to the dapp and using
     * previously generated keys to perform operations.
     */

    // Retrieve and parse the stored key data
    const keyGenData = parse(storedKeyData) as KeyGenData

    // Create new client instance (simulating new session)
    const danNexusClient = nexusClient.extend(danActions())

    // Send transaction using restored keys
    const hash = await danNexusClient.sendTx({
      keyGenData,
      calls: [
        {
          to: userTwo.address,
          value: 1n // Transfer 1 wei
        }
      ]
    })

    const { status } = await testClient.waitForTransactionReceipt({ hash })
    // Verify transaction success
    expect(status).toBe("success")
  })
})
