import { http, type Chain, type LocalAccount, encodePacked } from "viem"
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
import { ownableActions } from "./decorators"
import { toOwnables } from "./toOwnables"

describe("modules.ownableValidator.dx", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
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
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should demonstrate ownables module dx", async () => {
    // Create a Nexus client for the main account (eoaAccount)
    // This client will be used to interact with the smart contract account
    const nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    // Fund the account and deploy the smart contract wallet
    // This is just a reminder to fund the account and deploy the smart contract wallet
    await fundAndDeployClients(testClient, [nexusClient])

    // Create an ownables module with the following configuration:
    // - Threshold: 2 (requires 2 signatures for approval)
    // - Owners: userThree and userTwo
    const ownableModule = toOwnables({
      account: nexusClient.account,
      signer: eoaAccount,
      moduleInitArgs: {
        threshold: 2n,
        owners: [userThree.address, userTwo.address]
      }
    })

    // Install the ownables module on the Nexus client's smart contract account
    const hash = await nexusClient.installModule({
      module: ownableModule.moduleInitData
    })

    // Extend the Nexus client with ownable-specific actions
    // This allows the client to use the new module's functionality
    const ownableNexusClient = nexusClient.extend(ownableActions(ownableModule))

    // Wait for the module installation transaction to be mined and check its success
    const { success } = await ownableNexusClient.waitForUserOperationReceipt({
      hash
    })
    expect(success).toBe(true)

    // Prepare a user operation to withdraw 1 wei to userTwo
    // This demonstrates a simple transaction that requires multi-sig approval
    // @ts-ignore
    const withdrawalUserOp = await ownableNexusClient.prepareUserOperation({
      calls: [
        {
          to: userTwo.address,
          value: 1n
        }
      ]
    })

    // Get the hash of the user operation
    // This hash will be signed by the required owners
    const withdrawalUserOpHash =
      // @ts-ignore
      await nexusClient.account.getUserOpHash(withdrawalUserOp)

    // Collect signatures from both required owners (userTwo and userThree)
    const signatures = await Promise.all(
      [userTwo, userThree].map(async (signer) => {
        return signer.signMessage({
          message: { raw: withdrawalUserOpHash }
        })
      })
    )

    // Combine the signatures and set them on the user operation
    // The order of signatures should match the order of owners in the module configuration
    withdrawalUserOp.signature = await ownableNexusClient.prepareSignatures({
      signatures
    })
    // Send the user operation with the collected signatures
    const userOpHash = await nexusClient.sendUserOperation(withdrawalUserOp)

    // Wait for the user operation to be mined and check its success
    const { success: userOpSuccess } =
      await ownableNexusClient.waitForUserOperationReceipt({ hash: userOpHash })

    // Verify that the multi-sig transaction was successful
    expect(userOpSuccess).toBe(true)
  })
})
