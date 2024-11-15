import { http, type Address, type Chain, type Hex, toBytes, toHex } from "viem"
import type { LocalAccount, PublicClient } from "viem"
import { encodeFunctionData } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../test/__contracts/abi"
import { testAddresses } from "../../test/callDatas"
import { toNetwork } from "../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../test/testUtils"
import { SMART_SESSIONS_ADDRESS } from "../constants"
import { isPermissionEnabled } from "../modules/smartSessionsValidator/Helpers"
import type { CreateSessionDataParams } from "../modules/smartSessionsValidator/Types"
import {
  smartSessionCreateActions,
  smartSessionUseActions
} from "../modules/smartSessionsValidator/decorators"
import { toSmartSessionsValidator } from "../modules/smartSessionsValidator/toSmartSessionsValidator"
import type { Module } from "../modules/utils/Types"
import { type NexusClient, createNexusClient } from "./createNexusClient"
import { createNexusSessionClient } from "./createNexusSessionClient"

describe("nexus.session.client", async () => {
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
  let cachedPermissionId: Hex

  let sessionsModule: Module

  beforeAll(async () => {
    network = await toNetwork("BASE_SEPOLIA_FORKED")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    sessionKeyAccount = getTestAccount(1)
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
      module: {
        type: "validator",
        address: SMART_SESSIONS_ADDRESS
      }
    })
    expect(isInstalledAfter).toBe(true)
  })

  test("should create a session to increment a counter (USE MODE)", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: sessionsModule
    })

    expect(isInstalledBefore).toBe(true)

    const nexusSessionClient = nexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    const trustAttestersHash = await nexusSessionClient.trustAttesters()
    const userOpReceipt = await nexusSessionClient.waitForUserOperationReceipt({
      hash: trustAttestersHash
    })
    const { status } = await testClient.waitForTransactionReceipt({
      hash: userOpReceipt.receipt.transactionHash
    })
    expect(status).toBe("success")

    // session key signer address is declared here
    const sessionRequestedInfo: CreateSessionDataParams[] = [
      {
        sessionPublicKey, // session key signer
        actionPoliciesInfo: [
          {
            contractAddress: testAddresses.Counter, // counter address
            functionSelector: "0x273ea3e3" as Hex // function selector for increment count
          }
        ]
      }
    ]

    nexusClient.account.getCounterFactualAddress()

    const createSessionsResponse = await nexusSessionClient.grantPermission({
      sessionRequestedInfo
    })

    expect(createSessionsResponse.userOpHash).toBeDefined()
    expect(createSessionsResponse.permissionIds).toBeDefined()
    ;[cachedPermissionId] = createSessionsResponse.permissionIds

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: createSessionsResponse.userOpHash
    })

    expect(receipt.success).toBe(true)

    const isEnabled = await isPermissionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)
  }, 60000)

  test("session signer should use session to increment a counter for a user (USE MODE)", async () => {
    const counterBefore = await testClient.readContract({
      address: testAddresses.Counter,
      abi: CounterAbi,
      functionName: "getNumber"
    })

    const smartSessionNexusClient = await createNexusSessionClient({
      chain,
      accountAddress: nexusClient.account.address,
      signer: sessionKeyAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    const usePermissionsModule = toSmartSessionsValidator({
      account: smartSessionNexusClient.account,
      signer: sessionKeyAccount,
      moduleData: {
        permissionIds: [cachedPermissionId]
      }
    })

    const useSmartSessionNexusClient = smartSessionNexusClient.extend(
      smartSessionUseActions(usePermissionsModule)
    )

    const userOpHash = await useSmartSessionNexusClient.usePermission({
      calls: [
        {
          to: testAddresses.Counter,
          data: encodeFunctionData({
            abi: CounterAbi,
            functionName: "incrementNumber",
            args: []
          })
        }
      ]
    })

    expect(userOpHash).toBeDefined()
    const receipt =
      await useSmartSessionNexusClient.waitForUserOperationReceipt({
        hash: userOpHash
      })
    expect(receipt.success).toBe(true)

    const counterAfter = await testClient.readContract({
      address: testAddresses.Counter,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    expect(counterAfter).toBe(counterBefore + BigInt(1))
  }, 60000)

  test("session signer is not allowed to send unauthorised action", async () => {
    const usePermissionsModule = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: sessionKeyAccount,
      moduleData: {
        permissionIds: [cachedPermissionId]
      }
    })

    const smartSessionNexusClient = await createNexusSessionClient({
      chain,
      accountAddress: nexusClient.account.address,
      signer: sessionKeyAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    const useSmartSessionNexusClient = smartSessionNexusClient.extend(
      smartSessionUseActions(usePermissionsModule)
    )

    const isEnabled = await isPermissionEnabled({
      client: testClient as unknown as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)

    const counterBefore = await testClient.readContract({
      address: testAddresses.Counter,
      abi: CounterAbi,
      functionName: "getNumber"
    })

    // @note this should fail as session signer is not allowed to send this action
    // @note session signer is only allowed to call incrementNumber

    expect(
      useSmartSessionNexusClient.usePermission({
        calls: [
          {
            to: testAddresses.Counter,
            data: encodeFunctionData({
              abi: CounterAbi,
              functionName: "decrementNumber"
            })
          }
        ]
      })
    ).rejects.toThrow()

    const counterAfter = await testClient.readContract({
      address: testAddresses.Counter,
      abi: CounterAbi,
      functionName: "getNumber",
      args: []
    })

    expect(counterAfter).toBe(counterBefore)
  }, 60000)
})
