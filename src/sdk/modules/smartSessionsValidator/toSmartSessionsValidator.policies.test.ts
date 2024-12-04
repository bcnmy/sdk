import {
  http,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
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
import type { Module } from "../utils/Types"
import { smartSessionCreateActions } from "./decorators"
import { toSmartSessionsValidator } from "./toSmartSessionsValidator"

describe("modules.smartSessions.policies", async () => {
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

  let sessionsModule: Module

  beforeAll(async () => {
    network = await toNetwork("BASE_SEPOLIA_FORKED")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    sessionKeyAccount = privateKeyToAccount(generatePrivateKey()) // Generally belongs to the dapp
    sessionPublicKey = sessionKeyAccount.address

    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
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
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: sessionsModule.moduleInitData
    })

    if (!isInstalledBefore) {
      const hash = await nexusClient.installModule({
        module: sessionsModule.moduleInitData
      })

      const { success: installSuccess } =
        await nexusClient.waitForUserOperationReceipt({ hash })
      expect(installSuccess).toBe(true)
    }

    const isInstalledAfter = await nexusClient.isModuleInstalled({
      module: sessionsModule.moduleInitData
    })
    expect(isInstalledAfter).toBe(true)
  })

  test("should grant permission with all available policies", async () => {
    const usersNexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    // Create a smart sessions module for the user's account
    sessionsModule = toSmartSessionsValidator({
      account: usersNexusClient.account,
      signer: eoaAccount
    })

    // Extend the Nexus client with smart session creation actions
    const nexusSessionClient = usersNexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    // Define the session parameters
    // This includes the session key, validator, and action policies
    const createSessionsResponse = await nexusSessionClient.grantPermission({
      sessionRequestedInfo: [
        {
          sessionPublicKey, // Public key of the session
          sessionValidUntil: Date.now() + 1000 * 60 * 60 * 24, // 1 day from now
          chainIds: [BigInt(chain.id)],
          actionPoliciesInfo: [
            {
              contractAddress: testAddresses.Counter,
              sudo: false, // covered in another test
              tokenLimits: [
                {
                  token: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
                  limit: BigInt(1000)
                }
              ], // covered in another test
              // usageLimit: 1000n, // TODO: failing because of attestations
              // valueLimit: 1000n, // TODO: failing because of attestations
              validUntil: Date.now() + 1000 * 60 * 60 * 24, // 1 day from now
              functionSelector: "0x871cc9d4" // decrementNumber
            }
          ]
        }
      ]
    })

    // Wait for the session creation transaction to be mined and check its success
    const { success: sessionCreateSuccess } =
      await nexusSessionClient.waitForUserOperationReceipt({
        hash: createSessionsResponse.userOpHash
      })

    expect(sessionCreateSuccess).toBe(true)
  })
})
