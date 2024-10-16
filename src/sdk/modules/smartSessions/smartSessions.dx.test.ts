import {
  http,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  encodeFunctionData,
  pad,
  toBytes,
  toHex
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../test/__contracts/abi/CounterAbi"
import { TEST_CONTRACTS } from "../../../test/callDatas"
import { testAddresses } from "../../../test/callDatas"
import { toNetwork } from "../../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../../test/testUtils"
import addresses from "../../__contracts/addresses"
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import { createNexusSessionClient } from "../../clients/createNexusSessionClient"
import { parseReferenceValue } from "../utils/Helpers"
import type { ModularSmartAccount, Module } from "../utils/Types"
import policies from "./Helpers"
import type { CreateSessionDataParams } from "./Types"
import { ParamCondition } from "./Types"
import { smartSessionCreateActions, smartSessionUseActions } from "./decorators"
import { toSmartSessions } from "./toSmartSessions"

describe("modules.smartSessions.dx", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let usersNexusClient: NexusClient
  let cachedPermissionId: Hex
  let sessionKeyAccount: LocalAccount
  let sessionPublicKey: Address

  let sessionsModule: Module

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    sessionKeyAccount = getTestAccount(1)
    sessionPublicKey = sessionKeyAccount.address
    testClient = toTestClient(chain, getTestAccount(5))
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should demonstrate creating a smart session", async () => {
    /**
     * This test demonstrates the creation and use of a smart session from two perspectives:
     *
     * 1. User Perspective (first half of the test):
     *    - Create a Nexus client for the user's account
     *    - Install the smart sessions module on the user's account
     *    - Create a smart session with specific permissions
     *
     * 2. Dapp Perspective (second half of the test):
     *    - Simulate a scenario where the user has left the dapp
     *    - Create a new Nexus client using the session key
     *    - Use the session to perform actions on behalf of the user
     *
     * This test showcases how smart sessions enable controlled, delegated actions
     * on a user's smart account, even after the user is no longer actively engaged.
     */

    // User Perspective: Creating and setting up the smart session

    // Create a Nexus client for the main account (eoaAccount)
    // This client will be used to interact with the smart contract account
    const usersNexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    // Fund the account and deploy the smart contract wallet
    await fundAndDeployClients(testClient, [usersNexusClient])

    // Create a smart sessions module for the user's account
    sessionsModule = toSmartSessions({
      account: usersNexusClient.account,
      signer: eoaAccount
    })

    // Install the smart sessions module on the Nexus client's smart contract account
    const hash = await usersNexusClient.installModule({
      module: sessionsModule.moduleInitData
    })

    // Wait for the module installation transaction to be mined and check its success
    const { success: installSuccess } =
      await usersNexusClient.waitForUserOperationReceipt({ hash })

    expect(installSuccess).toBe(true)

    // Define the session parameters
    // This includes the session key, validator, and action policies
    const sessionRequestedInfo: CreateSessionDataParams[] = [
      {
        sessionPublicKey, // Public key of the session
        sessionValidatorAddress: TEST_CONTRACTS.SimpleSessionValidator.address,
        sessionKeyData: toHex(toBytes(sessionPublicKey)),
        sessionValidAfter: 0, // Session valid immediately
        sessionValidUntil: 0, // Session valid indefinitely
        actionPoliciesInfo: [
          {
            contractAddress: TEST_CONTRACTS.Counter.address,
            functionSelector: "0x273ea3e3" as Hex, // Selector for 'incrementNumber'
            validUntil: 0, // Policy valid indefinitely
            validAfter: 0, // Policy valid immediately
            rules: [], // No additional rules
            valueLimit: BigInt(0) // No value limit
          }
        ]
      }
    ]

    // Extend the Nexus client with smart session creation actions
    const nexusSessionClient = usersNexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    // Create the smart session
    const createSessionsResponse = await nexusSessionClient.createSessions({
      sessionRequestedInfo
    })
    ;[cachedPermissionId] = createSessionsResponse.permissionIds

    // Wait for the session creation transaction to be mined and check its success
    const { success: sessionCreateSuccess } =
      await usersNexusClient.waitForUserOperationReceipt({
        hash: createSessionsResponse.userOpHash
      })

    expect(installSuccess).toBe(sessionCreateSuccess)

    // Now assume the user has left the dapp and the usersNexusClient signer is no longer available
    // The following code demonstrates how a dapp can use the session to act on behalf of the user

    // Create a new smart sessions module with the session key
    const useSessionsModule = toSmartSessions({
      account: usersNexusClient.account,
      signer: sessionKeyAccount,
      permission: {
        permissionId: cachedPermissionId
      }
    })

    // Create a new Nexus client for the session
    // This client will be used to interact with the smart contract account using the session key
    const smartSessionNexusClient = await createNexusSessionClient({
      chain,
      accountAddress: usersNexusClient.account.address,
      signer: sessionKeyAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    // Extend the session client with smart session use actions
    const useSmartSessionNexusClient = smartSessionNexusClient.extend(
      smartSessionUseActions(useSessionsModule)
    )

    // Use the session to perform an action (increment the counter)
    const userOpHash = await useSmartSessionNexusClient.useSession({
      actions: [
        {
          target: TEST_CONTRACTS.Counter.address,
          value: 0n,
          callData: encodeFunctionData({
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
  }, 60000) // Test timeout set to 60 seconds
})
