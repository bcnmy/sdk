import { http, type Address, type Chain, type LocalAccount } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../../test/__contracts/abi/CounterAbi"
import { testAddresses } from "../../../../test/callDatas"
import { toNetwork } from "../../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../../test/testUtils"
import {
  type NexusClient,
  createSmartAccountClient
} from "../../../clients/createSmartAccountClient"
import {
  TEST_ADDRESS_K1_VALIDATOR_ADDRESS,
  TEST_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
} from "../../../constants"
import type { CreateSessionDataParams } from "../Types"
import {
  type SmartSessionModule,
  toSmartSessionsValidator
} from "../toSmartSessionsValidator"
import { smartSessionCreateActions, smartSessionUseActions } from "./"

describe("modules.smartSessions.decorators", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let sessionKeyAccount: LocalAccount
  let nexusClient: NexusClient
  let nexusAccountAddress: Address
  let sessionPublicKey: Address
  let sessionRequestedInfo: CreateSessionDataParams[]
  let sessionsModule: SmartSessionModule

  beforeAll(async () => {
    network = await toNetwork()

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
      validatorAddress: TEST_ADDRESS_K1_VALIDATOR_ADDRESS,
      factoryAddress: TEST_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
    })

    sessionRequestedInfo = [
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

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await fundAndDeployClients(testClient, [nexusClient])
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should test create smart session decorators", async () => {
    const sessionsModule = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: eoaAccount
    })

    const hash = await nexusClient.installModule({
      module: sessionsModule.moduleInitData
    })

    const { success: installSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash })
    expect(installSuccess).toBe(true)

    const nexusSessionClient = nexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    expect(nexusSessionClient).toBeDefined()
    expect(nexusSessionClient.grantPermission).toBeTypeOf("function")
    expect(nexusSessionClient.grantPermission).toBeTypeOf("function")
  })

  test("should test use smart session decorators", async () => {
    const usePermissionsModule = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: sessionKeyAccount
    })

    const smartSessionNexusClient = await createSmartAccountClient({
      chain,
      accountAddress: nexusClient.account.address,
      signer: sessionKeyAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    const nexusSessionClient = smartSessionNexusClient.extend(
      smartSessionUseActions(usePermissionsModule)
    )

    expect(nexusSessionClient).toBeDefined()
    expect(nexusSessionClient.usePermission).toBeTypeOf("function")
  })
})
