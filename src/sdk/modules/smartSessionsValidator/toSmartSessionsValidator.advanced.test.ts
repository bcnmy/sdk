import {
  http,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  getAddress
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../test/__contracts/abi/CounterAbi"
import { testAddresses } from "../../../test/callDatas"
import { toNetwork } from "../../../test/testSetup"
import { getTestParamsForTestnet } from "../../../test/testUtils"
import type { NetworkConfig, TestnetParams } from "../../../test/testUtils"
import { type NexusAccount, toNexusAccount } from "../../account/toNexusAccount"
import {
  type NexusClient,
  createSmartAccountClient
} from "../../clients/createSmartAccountClient"
import { SmartSessionMode } from "../../constants"
import { parse, stringify } from "./Helpers"
import type { SessionData } from "./Types"
import { smartSessionCreateActions, smartSessionUseActions } from "./decorators"
import { toSmartSessionsValidator } from "./toSmartSessionsValidator"

describe("modules.smartSessions.advanced.dx", async () => {
  let network: NetworkConfig
  // Required for "TESTNET_FROM_ENV_VARS" networks
  let testnetParams: TestnetParams

  let chain: Chain
  let bundlerUrl: string
  let paymasterUrl: undefined | string
  let walletClient: WalletClient

  // Test utils
  let publicClient: PublicClient // publicClient not available on public testnets
  let eoaAccount: PrivateKeyAccount
  let recipientAddress: Address
  let nexusAccountAddress: Address
  let nexusAccount: NexusAccount
  let nexusClient: NexusClient

  let sessionKeyAccount: LocalAccount
  let sessionPublicKey: Address

  let stringifiedSessionDatum: string
  const index = 2n

  beforeAll(async () => {
    network = await toNetwork("TESTNET_FROM_ENV_VARS")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    paymasterUrl = network.paymasterUrl
    eoaAccount = network.account as PrivateKeyAccount

    sessionKeyAccount = privateKeyToAccount(generatePrivateKey()) // Generally belongs to the dapp
    sessionPublicKey = getAddress(sessionKeyAccount.address)

    recipientAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth

    walletClient = createWalletClient({
      account: eoaAccount,
      chain,
      transport: http()
    })

    publicClient = createPublicClient({
      chain,
      transport: http()
    })

    testnetParams = getTestParamsForTestnet(publicClient)

    nexusAccount = await toNexusAccount({
      index,
      signer: eoaAccount,
      chain,
      transport: http(),
      ...testnetParams
    })

    nexusAccountAddress = await nexusAccount.getCounterFactualAddress()

    console.log({ nexusAccountAddress })

    nexusClient = await createSmartAccountClient({
      index,
      account: nexusAccount,
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      ...testnetParams
    })
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
    const sessionsModule = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: eoaAccount
    })

    const isInstalled = await nexusClient.isModuleInstalled({
      module: sessionsModule.moduleInitData
    })

    if (!isInstalled) {
      const opHash = await nexusClient.installModule({
        module: sessionsModule.moduleInitData
      })
      const installReceipt = await nexusClient.waitForUserOperationReceipt({
        hash: opHash
      })
      expect(installReceipt.success).toBe("true")
    }

    // Extend the Nexus client with smart session creation actions
    const nexusSessionClient = nexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    // Define the session parameters
    // This includes the session key, validator, and action policies
    const createSessionsResponse =
      await nexusSessionClient.grantPermissionInAdvance({
        sessionRequestedInfo: [
          {
            sessionPublicKey, // Public key of the session
            // sessionValidUntil: number
            // sessionValidAfter: number
            // chainIds: bigint[]
            actionPoliciesInfo: [
              {
                abi: CounterAbi,
                contractAddress: testAddresses.Counter
                // validUntil?: number
                // validAfter?: number
                // valueLimit?: bigint
              }
            ]
          }
        ]
      })

    // Wait for the session creation transaction to be mined and check its success
    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: createSessionsResponse.userOpHash
    })

    expect(receipt.success).toBe("true")

    // Prepare the session data to be stored by the dApp. This could be saved in a Database by the dApp, or client side in local storage.
    const sessionData: SessionData = {
      granter: nexusClient.account.address,
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
  }, 200000)

  test("should demonstrate using a smart session from dapp's perspective", async () => {
    // Now assume the user has left the dapp and the nexusClient signer is no longer available
    // The following code demonstrates how a dapp can use the session to act on behalf of the user

    // Unzip the session data
    const usersSessionData = parse(stringifiedSessionDatum)

    // Create a new Nexus client for the session
    // This client will be used to interact with the smart contract account using the session key
    const smartSessionNexusClient = await createSmartAccountClient({
      index,
      chain,
      accountAddress: usersSessionData.granter,
      signer: sessionKeyAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      ...testnetParams
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

    // Use the session to perform an action (increment and decrement the counter using the same permissionId)
    // @ts-ignore
    const userOpHash = await useSmartSessionNexusClient.debugUserOperation({
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

    expect(sessionUseSuccess).toBe("true")
  }, 200000) // Test timeout set to 60 seconds
})
