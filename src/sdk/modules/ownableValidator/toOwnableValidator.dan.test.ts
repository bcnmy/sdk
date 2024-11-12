import { http, type Chain, type LocalAccount } from "viem"
import type { BundlerClient } from "viem/account-abstraction"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../../test/testUtils"
import { createNexusClient } from "../../clients/createNexusClient"
import { danActions } from "../../clients/decorators/dan/decorators"
import { keyGen } from "../../clients/decorators/dan/decorators/keyGen"
import { ownableActions } from "./decorators"
import { toOwnableValidator } from "./toOwnableValidator"

describe("modules.dan.dx", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount

  const recipient = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)

    testClient = toTestClient(chain, getTestAccount(5))
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should demonstrate ownables module dx using a dan account", async () => {
    const nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    const danNexusClient = nexusClient.extend(danActions())

    const keyGenData = await danNexusClient.keyGen()

    // Fund the account and deploy the smart contract wallet
    // This is just a reminder to fund the account and deploy the smart contract wallet
    await fundAndDeployClients(testClient, [nexusClient])

    // Create an ownables module with the following configuration:
    // - Threshold: 1 (requires 1 signature for approval)
    // - Owners: danAccount
    const ownableModule = toOwnableValidator({
      account: nexusClient.account,
      signer: eoaAccount,
      moduleInitArgs: {
        threshold: 1n,
        owners: [keyGenData.sessionPublicKey]
      }
    })

    // Install the ownables module on the Nexus client's smart contract account
    const hash = await nexusClient.installModule({
      module: ownableModule.moduleInitData
    })

    // Extend the Nexus client with ownable-specific actions
    // This allows the client to use the new module's functionality
    const ownableDanClient = nexusClient
      .extend(ownableActions(ownableModule))
      .extend(danActions())

    // Wait for the module installation transaction to be mined and check its success
    await ownableDanClient.waitForUserOperationReceipt({ hash })

    // Prepare a user operation to withdraw 1 wei to userTwo
    // This demonstrates a simple transaction that requires multi-sig approval
    // @ts-ignore
    const withdrawalUserOp = await ownableDanClient.prepareUserOperation({
      calls: [
        {
          to: recipient, // vitalik.eth
          value: 1n
        }
      ]
    })

    // Collect signature
    const { signature } = await ownableDanClient.sigGen({
      keyGenData,
      ...withdrawalUserOp
    })

    if (!signature) throw new Error("Missing signature")

    // Send the user operation with the collected signatures
    const userOpHash = await nexusClient.sendUserOperation({
      ...withdrawalUserOp,
      signature
    })

    // Wait for the user operation to be mined and check its success
    const { success: userOpSuccess } =
      await ownableDanClient.waitForUserOperationReceipt({ hash: userOpHash })

    // Verify that the multi-sig transaction was successful
    expect(userOpSuccess).toBe(true)
  })
})
