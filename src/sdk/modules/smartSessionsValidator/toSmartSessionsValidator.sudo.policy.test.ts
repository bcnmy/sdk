import {
  http,
  type AbiFunction,
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
  createSmartAccountClient
} from "../../clients/createSmartAccountClient"
import { SmartSessionMode } from "../../constants"
import type { Module } from "../utils/Types"
import { parse, stringify } from "./Helpers"
import type { SessionData } from "./Types"
import { smartSessionCreateActions, smartSessionUseActions } from "./decorators"
import { toSmartSessionsValidator } from "./toSmartSessionsValidator"

describe("modules.smartSessions.sudo.policy", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let nexusClient: NexusClient
  let nexusAccountAddress: Address
  let sessionKeyAccount: LocalAccount
  let sessionPublicKey: Address

  let stringifiedSessionDatum: string // Session data to be stored by the dApp

  let sessionsModule: Module

  beforeAll(async () => {
    network = await toNetwork("BESPOKE_ANVIL_NETWORK_FORKING_BASE_SEPOLIA")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    sessionKeyAccount = privateKeyToAccount(generatePrivateKey()) // Generally belongs to the dapp
    sessionPublicKey = sessionKeyAccount.address

    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createSmartAccountClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      useTestBundler: true
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()

    sessionsModule = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: eoaAccount
    })

    await fundAndDeployClients(testClient, [nexusClient])
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should install smartSessionValidator with no init data", async () => {
    // Create a smart sessions module for the user's account
    sessionsModule = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: eoaAccount
    })

    // Install the smart sessions module on the Nexus client's smart contract account
    const hash = await nexusClient.installModule({
      module: sessionsModule.moduleInitData
    })

    const { success } = await nexusClient.waitForUserOperationReceipt({ hash })
    expect(success).toBe(true)

    // Extend the Nexus client with smart session creation actions
    const usersNexusClient = nexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    const createSessionsResponse = await usersNexusClient.grantPermission({
      sessionRequestedInfo: [
        {
          sessionPublicKey,
          // sessionValidUntil: number
          // sessionValidAfter: number
          // chainIds: bigint[]
          actionPoliciesInfo: [
            {
              abi: CounterAbi,
              contractAddress: testAddresses.Counter,
              sudo: true
            }
          ]
        }
      ]
    })

    // Wait for the session creation transaction to be mined and check its success
    const { success: sessionCreateSuccess } =
      await usersNexusClient.waitForUserOperationReceipt({
        hash: createSessionsResponse.userOpHash
      })

    expect(sessionCreateSuccess).toBe(true)

    // Prepare the session data to be stored by the dApp. This could be saved in a Database by the dApp, or client side in local storage.
    const sessionData: SessionData = {
      granter: usersNexusClient?.account?.address as Hex,
      sessionPublicKey,
      description: `Session to increment a counter for ${testAddresses.Counter}`,
      moduleData: {
        permissionIds: createSessionsResponse.permissionIds,
        action: createSessionsResponse.action,
        mode: SmartSessionMode.USE,
        sessions: createSessionsResponse.sessions
      }
    }

    // Zip the session data, and store it for later use by a dapp
    stringifiedSessionDatum = stringify(sessionData)
  })

  test("should demonstrate using a smart session from dapp's perspective", async () => {
    // Now assume the user has left the dapp and the usersNexusClient signer is no longer available
    // The following code demonstrates how a dapp can use the session to act on behalf of the user

    // Unzip the session data
    const usersSessionData = parse(stringifiedSessionDatum)

    // Create a new Nexus client for the session
    // This client will be used to interact with the smart contract account using the session key
    const smartSessionNexusClient = await createSmartAccountClient({
      chain,
      accountAddress: usersSessionData.granter,
      signer: sessionKeyAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      useTestBundler: true
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

    const counterBefore = await testClient.readContract({
      address: testAddresses.Counter,
      abi: CounterAbi,
      functionName: "getNumber"
    })

    // Use the session to perform an action (increment the counter)
    const userOpHash = await useSmartSessionNexusClient.usePermission({
      calls: [
        {
          to: testAddresses.Counter,
          data: encodeFunctionData({
            abi: CounterAbi,
            functionName: "incrementNumber"
          })
        },
        {
          to: testAddresses.Counter,
          data: encodeFunctionData({
            abi: CounterAbi,
            functionName: "decrementNumber"
          })
        }
      ]
    })

    const counterAfter = await testClient.readContract({
      address: testAddresses.Counter,
      abi: CounterAbi,
      functionName: "getNumber"
    })

    // Counter should be unchanged
    expect(counterAfter).toBe(counterBefore)

    // Wait for the action to be mined and check its success
    const { success: sessionUseSuccess } =
      await useSmartSessionNexusClient.waitForUserOperationReceipt({
        hash: userOpHash
      })

    expect(sessionUseSuccess).toBe(true)
  }, 200000) // Test timeout set to 60 seconds
})
