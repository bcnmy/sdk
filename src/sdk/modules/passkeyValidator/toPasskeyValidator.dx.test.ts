import { afterAll, beforeAll, describe, test } from "vitest"
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import {
  type NetworkConfig,
  getTestAccount,
  killNetwork
} from "./../../../test/testUtils"

import { http, type Chain, type LocalAccount, createPublicClient } from "viem"
import { toNetwork } from "../../../test/testSetup"
import { toPasskeyValidator } from "./toPasskeyValidator"
import { WebAuthnMode, toWebAuthnKey } from "./toWebAuthnKey"

describe.skip("modules.passkeyValidator.dx", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  let eoaAccount: LocalAccount
  let passkeyNexusClient: NexusClient
  let nexusClient: NexusClient

  beforeAll(async () => {
    // Initialize the network and account details
    network = await toNetwork("PUBLIC_TESTNET")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)

    // Create a public client for the test network
    const publicClient = createPublicClient({
      chain,
      transport: http()
    })
  })

  afterAll(async () => {
    // Clean up the network after tests
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should setup and use passkey validator to sign a transaction", async () => {
    /**
     * This test demonstrates the creation and use of an passkey module:
     *
     * 1. Setup and Installation:
     *    - Create a Nexus client for the main account
     *    - Create the credentials for the passkey validator
     *    - Install the passkey validator module on the smart contract account
     *    - Create a Nexus client with the passkey validator module
     *
     * 2. Use the passkey validator to sign a transaction
     *    - Send a transaction using the passkey validator
     *    - Wait for the transaction to be mined and retrieve the receipt
     *
     * This test showcases how to install and setup a passkey validator module on Nexus
     */
    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    // Create the credentials for the passkey validator, these values will be used as initData when installing the module
    const webAuthnKey = await toWebAuthnKey({
      passkeyName: "nexus", // Name of your passkey
      mode: WebAuthnMode.Register // Here we are creating a new passkey, if you want to use an existing passkey, use WebAuthnMode.Login
    })

    // Initialize the passkey validator with the WebAuthn key and account details
    const passkeyValidator = await toPasskeyValidator({
      webAuthnKey,
      signer: eoaAccount,
      accountAddress: nexusClient.account.address,
      chainId: chain.id
    })

    // Install the passkey validator module on the smart contract account
    const opHash = await nexusClient.installModule({ module: passkeyValidator })
    // Wait for the installation transaction to be mined
    await nexusClient.waitForUserOperationReceipt({ hash: opHash })

    // Create a Nexus client with the passkey validator module
    passkeyNexusClient = await createNexusClient({
      signer: eoaAccount,
      chain: chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      module: passkeyValidator
    })

    // Sending a transaction will be signed by the passkey validator
    const txHash = await passkeyNexusClient.sendTransaction({
      calls: [
        {
          to: eoaAccount.address,
          value: 0n
        }
      ]
    })

    // Wait for the transaction to be mined and retrieve the receipt
    const receipt = await passkeyNexusClient.waitForTransactionReceipt({
      hash: txHash
    })
  })
})
