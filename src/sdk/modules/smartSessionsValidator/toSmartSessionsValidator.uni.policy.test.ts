import {
  http,
  type AbiFunction,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  type PublicClient,
  encodeFunctionData,
  getContract,
  slice,
  toBytes,
  toFunctionSelector,
  toHex
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { MockRegistryAbi } from "../../../test/__contracts/abi"
import { MockCalleeAbi } from "../../../test/__contracts/abi/MockCalleeAbi"
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
import { SMART_SESSIONS_ADDRESS } from "../../constants"
import type { Module } from "../utils/Types"
import { isPermissionEnabled } from "./Helpers"
import type { CreateSessionDataParams, Rule } from "./Types"
import { ParamCondition } from "./Types"
import { smartSessionCreateActions, smartSessionUseActions } from "./decorators"
import { toSmartSessionsValidator } from "./toSmartSessionsValidator"

describe("modules.smartSessions.uniPolicy", async () => {
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

  test("should add balance to mock callee", async () => {
    const mockContract = getContract({
      address: testAddresses.MockCallee,
      abi: MockCalleeAbi,
      client: testClient
    })
    const balUint = 123n
    const balBytes32 = `0x${balUint.toString(16).padStart(64, "0")}`
    const balancesBefore = await mockContract.read.bals([nexusAccountAddress])
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: testAddresses.MockCallee,
          data: encodeFunctionData({
            abi: MockCalleeAbi,
            functionName: "addBalance",
            args: [nexusAccountAddress, balUint, balBytes32 as Hex]
          })
        }
      ]
    })
    const { status } = await nexusClient.waitForTransactionReceipt({ hash })
    expect(status).toBe("success")
    const balanceAfter = await mockContract.read.bals([nexusAccountAddress])
    expect(balanceAfter[0]).toBeGreaterThan(balancesBefore[0])
  }, 90000)

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

  test("should create MockCallee add balance session (USE mode) on installed smart session validator", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: {
        type: "validator",
        address: SMART_SESSIONS_ADDRESS
      }
    })

    expect(isInstalledBefore).toBe(true)

    const smartSessionNexusClient = nexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    const trustAttestersHash = await smartSessionNexusClient.trustAttesters()
    const userOpReceipt =
      await smartSessionNexusClient.waitForUserOperationReceipt({
        hash: trustAttestersHash
      })
    const { status } = await testClient.waitForTransactionReceipt({
      hash: userOpReceipt.receipt.transactionHash
    })
    expect(status).toBe("success")

    const functionSelector = "addBalance(address,uint256,bytes32)"

    const unparsedFunctionSelector = functionSelector as AbiFunction | string
    const parsedFunctionSelector = slice(
      toFunctionSelector(unparsedFunctionSelector),
      0,
      4
    )

    const maxUintDeposit = 123456n
    const minBytes32Deposit = `0x${maxUintDeposit
      .toString(16)
      .padStart(64, "0")}`

    const rules: Rule[] = [
      {
        condition: ParamCondition.EQUAL,
        offsetIndex: 0,
        isLimited: false,
        ref: nexusAccountAddress,
        usage: {
          limit: BigInt(0),
          used: BigInt(0)
        }
      },
      {
        condition: ParamCondition.LESS_THAN,
        offsetIndex: 1,
        isLimited: true,
        ref: maxUintDeposit,
        usage: {
          limit: BigInt(maxUintDeposit),
          used: BigInt(0)
        }
      },
      {
        condition: ParamCondition.GREATER_THAN,
        offsetIndex: 2,
        isLimited: false,
        ref: minBytes32Deposit,
        usage: {
          limit: BigInt(0),
          used: BigInt(0)
        }
      }
    ]

    const sessionRequestedInfo: CreateSessionDataParams[] = [
      {
        sessionPublicKey,
        actionPoliciesInfo: [
          {
            contractAddress: testAddresses.MockCallee, // mock callee address
            functionSelector: parsedFunctionSelector, // addBalance function selector
            rules
          }
        ]
      }
    ]

    const createSessionsResponse =
      await smartSessionNexusClient.grantPermission({ sessionRequestedInfo })

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
  }, 200000)

  test("should make use of already enabled session (USE mode) to add balance to MockCallee using a session key", async () => {
    const isEnabled = await isPermissionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)

    const mockContract = getContract({
      address: testAddresses.MockCallee,
      abi: MockCalleeAbi,
      client: testClient
    })

    // Note: if you try to add more than maxUintDeposit then you would get this below error.
    // Error: https://openchain.xyz/signatures?query=0x3b577361
    const balToAddUint = 1234n

    // Note: if you try to add less than minBytes32Deposit then you would get this below error.
    // Error: https://openchain.xyz/signatures?query=0x3b577361
    const balToAddBytes32 = `0x${BigInt(1234567)
      .toString(16)
      .padStart(64, "0")}`

    const balancesBefore = await mockContract.read.bals([nexusAccountAddress])

    // helpful for out of range test. If time range limit has been provided in the policy.
    // await testClient.setNextBlockTimestamp({
    //   timestamp: 9727001666n
    // })

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
          to: testAddresses.MockCallee,
          data: encodeFunctionData({
            abi: MockCalleeAbi,
            functionName: "addBalance",
            args: [nexusAccountAddress, balToAddUint, balToAddBytes32 as Hex]
          })
        }
      ]
    })

    expect(userOpHash).toBeDefined()
    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })
    expect(receipt.success).toBe(true)

    const balanceAfter = await mockContract.read.bals([nexusAccountAddress])
    expect(balanceAfter[0]).toBeGreaterThan(balancesBefore[0])
  }, 200000)
})
