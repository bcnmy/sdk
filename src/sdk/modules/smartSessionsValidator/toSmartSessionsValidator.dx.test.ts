import { SmartSessionMode } from "@rhinestone/module-sdk/module"
import {
  http,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  encodeFunctionData
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
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
import type { Module } from "../utils/Types"
import { parse, stringify } from "./Helpers"
import type { CreateSessionDataParams, SessionData } from "./Types"
import { smartSessionCreateActions, smartSessionUseActions } from "./decorators"
import { toSmartSessionsValidator } from "./toSmartSessionsValidator"

describe("modules.smartSessions.dx", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let usersNexusClient: NexusClient
  let sessionKeyAccount: LocalAccount
  let sessionPublicKey: Address

  let zippedSessionDatum: string
  let sessionsModule: Module

  beforeAll(async () => {
    network = await toNetwork("BASE_SEPOLIA_FORKED")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    sessionKeyAccount = privateKeyToAccount(generatePrivateKey()) // Generally belongs to the dapp
    sessionPublicKey = sessionKeyAccount.address
    testClient = toTestClient(chain, getTestAccount(5))
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  /**
   * This test demonstrates the creation and use of a smart session from two perspectives:
   *
   * 1. User Perspective (first test):
   *    - Create a Nexus client for the user's account
   *    - Install the smart sessions module on the user's account
   *    - Create a smart session with specific permissions
   *
   * 2. Dapp Perspective (second test):
   *    - Simulate a scenario where the user has left the dapp
   *    - Create a new Nexus client using the session key
   *    - Use the session to perform actions on behalf of the user
   *
   * This test showcases how smart sessions enable controlled, delegated actions
   * on a user's smart account, even after the user is no longer actively engaged.
   */
  test("should demonstrate creating a smart session from user's perspective", async () => {
    // User Perspective: Creating and setting up the smart session

    // Create a Nexus client for the main account (eoaAccount)
    // This client will be used to interact with the smart contract account
    usersNexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    // Fund the account and deploy the smart contract wallet
    await fundAndDeployClients(testClient, [usersNexusClient])

    // Create a smart sessions module for the user's account
    sessionsModule = toSmartSessionsValidator({
      account: usersNexusClient.account,
      signer: eoaAccount
    })

    // Install the smart sessions module on the Nexus client's smart contract account
    const hash = await usersNexusClient.installModule({
      module: sessionsModule.moduleInitData
    })

    // Extend the Nexus client with smart session creation actions
    const nexusSessionClient = usersNexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    // Wait for the module installation transaction to be mined and check its success
    const { success: installSuccess } =
      await usersNexusClient.waitForUserOperationReceipt({ hash })

    expect(installSuccess).toBe(true)

    // Define the session parameters
    // This includes the session key, validator, and action policies
    const sessionRequestedInfo: CreateSessionDataParams[] = [
      {
        sessionPublicKey, // Public key of the session
        actionPoliciesInfo: [
          {
            contractAddress: testAddresses.Counter,
            functionSelector: "0x273ea3e3" as Hex // Selector for 'incrementNumber'
          }
        ]
      }
    ]

    // Create the smart session
    const createSessionsResponse = await nexusSessionClient.grantPermission({
      sessionRequestedInfo
    })

    // Wait for the session creation transaction to be mined and check its success
    const { success: sessionCreateSuccess } =
      await usersNexusClient.waitForUserOperationReceipt({
        hash: createSessionsResponse.userOpHash
      })

    expect(installSuccess).toBe(sessionCreateSuccess)

    // Prepare the session data to be stored by the dApp. This could be saved in a Database by the dApp, or client side in local storage.
    const sessionData: SessionData = {
      granter: usersNexusClient.account.address,
      sessionPublicKey,
      moduleData: {
        permissionIds: createSessionsResponse.permissionIds,
        mode: SmartSessionMode.USE
      }
    }

    // Zip the session data, and store it for later use by a dapp
    zippedSessionDatum = stringify(sessionData)
  }, 200000)

  test("should demonstrate using a smart session from dapp's perspective", async () => {
    // Now assume the user has left the dapp and the usersNexusClient signer is no longer available
    // The following code demonstrates how a dapp can use the session to act on behalf of the user

    // Unzip the session data
    const usersSessionData = parse(zippedSessionDatum)

    // Create a new Nexus client for the session
    // This client will be used to interact with the smart contract account using the session key
    const smartSessionNexusClient = await createNexusSessionClient({
      chain,
      accountAddress: usersSessionData.granter,
      signer: sessionKeyAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    // Create a new smart sessions module with the session key
    const usePermissionsModule = toSmartSessionsValidator({
      account: smartSessionNexusClient.account,
      signer: sessionKeyAccount,
      moduleData: usersSessionData.moduleData
    })

    // Extend the session client with smart session use actions
    const useSmartSessionNexusClient = smartSessionNexusClient.extend(
      smartSessionUseActions(usePermissionsModule)
    )

    // Use the session to perform an action (increment the counter)
    const userOpHash = await useSmartSessionNexusClient.usePermission({
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

    // Wait for the action to be mined and check its success
    const { success: sessionUseSuccess } =
      await useSmartSessionNexusClient.waitForUserOperationReceipt({
        hash: userOpHash
      })

    expect(sessionUseSuccess).toBe(true)
  }, 200000) // Test timeout set to 60 seconds
})
