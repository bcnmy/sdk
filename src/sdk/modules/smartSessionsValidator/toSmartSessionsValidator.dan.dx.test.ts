import { SmartSessionMode } from "@rhinestone/module-sdk/module"
import {
  http,
  type Chain,
  type Hex,
  type LocalAccount,
  encodeFunctionData
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../test/__contracts/abi/CounterAbi"
import { testAddresses } from "../../../test/callDatas"
import { toNetwork } from "../../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../../test/testUtils"
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import { createNexusSessionClient } from "../../clients/createNexusSessionClient"
import { danActions } from "../../clients/decorators/dan"
import type { Module } from "../utils/Types"
import { parse, stringify } from "./Helpers"
import type { CreateSessionDataParams, SessionData } from "./Types"
import { smartSessionCreateActions, smartSessionUseActions } from "./decorators"
import { toSmartSessionsValidator } from "./toSmartSessionsValidator"

// This test suite demonstrates how to create and use a smart session using Biconomy's Distributed Sessions (DAN).
// Distributed Sessions enhance security and efficiency by storing session keys on Biconomy's Delegated Authorisation Network (DAN),
// providing features like automated transaction processing and reduced exposure of private keys.

describe("modules.smartSessions.dan.dx", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utilities and variables
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let usersNexusClient: NexusClient
  let dappAccount: LocalAccount
  let zippedSessionDatum: string
  let sessionsModule: Module

  beforeAll(async () => {
    // Setup test network and accounts
    network = await toNetwork("BASE_SEPOLIA_FORKED")
    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    dappAccount = getTestAccount(7)
    testClient = toTestClient(chain, getTestAccount(5))
  })

  afterAll(async () => {
    // Clean up the network after tests
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should demonstrate creating a smart session using DAN", async () => {
    // Initialize the user's Nexus client with DAN actions
    usersNexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    const danNexusClient = usersNexusClient.extend(danActions())

    // Generate a session key using DAN
    const keyGenData = await danNexusClient.keyGen()
    const sessionPublicKey = keyGenData.sessionPublicKey

    // Fund and deploy the user's smart account
    await fundAndDeployClients(testClient, [usersNexusClient])

    // Initialize the smart sessions validator module
    sessionsModule = toSmartSessionsValidator({
      account: usersNexusClient.account,
      signer: eoaAccount
    })

    // Install the sessions module
    const hash = await usersNexusClient.installModule({
      module: sessionsModule.moduleInitData
    })

    // Extend the Nexus client with smart session creation actions
    const nexusSessionClient = usersNexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    // Wait for the module installation to complete
    const { success: installSuccess } =
      await usersNexusClient.waitForUserOperationReceipt({ hash })

    expect(installSuccess).toBe(true)

    // Define the permissions for the smart session
    const sessionRequestedInfo: CreateSessionDataParams[] = [
      {
        sessionPublicKey, // Public key of the session stored in DAN
        actionPoliciesInfo: [
          {
            contractAddress: testAddresses.Counter,
            functionSelector: "0x273ea3e3" as Hex // Selector for 'incrementNumber' function
          }
        ]
      }
    ]

    // Create the smart session with the specified permissions
    const createSessionsResponse = await nexusSessionClient.grantPermission({
      sessionRequestedInfo
    })

    // Wait for the permission grant operation to complete
    const { success: sessionCreateSuccess } =
      await usersNexusClient.waitForUserOperationReceipt({
        hash: createSessionsResponse.userOpHash
      })

    expect(installSuccess).toBe(sessionCreateSuccess)

    // Prepare the session data to be stored by the dApp. This could be saved in a Database or client side in local storage.
    const sessionData: SessionData = {
      granter: usersNexusClient.account.address,
      sessionPublicKey,
      moduleData: {
        keyGenData,
        permissionIds: createSessionsResponse.permissionIds,
        mode: SmartSessionMode.USE
      }
    }

    // Serialize the session data
    zippedSessionDatum = stringify(sessionData)
  }, 200000)

  test("should demonstrate using a smart session using DAN", async () => {
    // Parse the session data received from the user
    const { moduleData, granter } = parse(zippedSessionDatum)

    // Initialize the smart session client's Nexus client
    const smartSessionNexusClient = await createNexusSessionClient({
      chain,
      accountAddress: granter,
      signer: dappAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    // Initialize the smart sessions validator module with the received module data
    const usePermissionsModule = toSmartSessionsValidator({
      account: smartSessionNexusClient.account,
      signer: dappAccount,
      moduleData // This includes the keyGenData
    })

    // Extend the Nexus client with smart session usage and dan actions
    const danSessionClient = smartSessionNexusClient
      .extend(smartSessionUseActions(usePermissionsModule))
      .extend(danActions())

    // Use the distributed permission to execute a transaction
    const userOpHash = await danSessionClient.useDistributedPermission({
      calls: [
        {
          to: testAddresses.Counter,
          data: encodeFunctionData({
            abi: CounterAbi,
            functionName: "incrementNumber"
          })
        }
      ]
    })

    // Wait for the transaction to be processed
    const { success: sessionUseSuccess } =
      await danSessionClient.waitForUserOperationReceipt({
        hash: userOpHash
      })

    expect(sessionUseSuccess).toBe(true)
  }, 200000) // Test timeout set to 200 seconds
})
