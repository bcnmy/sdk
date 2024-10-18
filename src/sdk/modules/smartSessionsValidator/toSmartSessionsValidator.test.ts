import { SmartSessionMode } from "@rhinestone/module-sdk/module"
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
  pad,
  slice,
  toBytes,
  toFunctionSelector,
  toHex
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../test/__contracts/abi/CounterAbi"
import { MockCalleeAbi } from "../../../test/__contracts/abi/MockCalleeAbi"
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
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import { createNexusSessionClient } from "../../clients/createNexusSessionClient"
import {
  SIMPLE_SESSION_VALIDATOR_ADDRESS,
  SMART_SESSIONS_ADDRESS
} from "../../constants"
import { parseReferenceValue } from "../utils/Helpers"
import type { ModularSmartAccount, Module } from "../utils/Types"
import policies, {
  isSessionEnabled,
  unzipSessionData,
  zipSessionData
} from "./Helpers"
import type { CreateSessionDataParams, Rule, SessionData } from "./Types"
import { ParamCondition } from "./Types"
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
  let cachedPermissionId: Hex
  let sessionKeyAccount: LocalAccount
  let sessionPublicKey: Address

  let zippedSessionDatum: string
  let sessionsModule: Module

  beforeAll(async () => {
    network = await toNetwork()

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
        sessionValidatorAddress: SIMPLE_SESSION_VALIDATOR_ADDRESS,
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

    const sessionData: SessionData = {
      granter: usersNexusClient.account.address,
      sessionPublicKey,
      moduleData: {
        permissionId: cachedPermissionId,
        mode: SmartSessionMode.USE
      }
    }

    // Zip the session data, and store it for later use by a dapp
    zippedSessionDatum = zipSessionData(sessionData)
  }, 60000)

  test("should demonstrate using a smart session from dapp's perspective", async () => {
    // Now assume the user has left the dapp and the usersNexusClient signer is no longer available
    // The following code demonstrates how a dapp can use the session to act on behalf of the user

    // Unzip the session data
    const usersSessionData = unzipSessionData(zippedSessionDatum)

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
    const useSessionsModule = toSmartSessionsValidator({
      account: smartSessionNexusClient.account,
      signer: sessionKeyAccount,
      moduleData: usersSessionData.moduleData
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

describe("modules.smartSessions", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let nexusClient: NexusClient
  let cachedPermissionId: Hex
  let sessionKeyAccount: LocalAccount
  let sessionPublicKey: Address

  let sessionsModule: Module

  beforeAll(async () => {
    network = await toNetwork()

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

    sessionsModule = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: eoaAccount
    })
    await fundAndDeployClients(testClient, [nexusClient])
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test.concurrent("should have smart account bytecode", async () => {
    const bytecodes = await Promise.all(
      [testAddresses.SmartSession, testAddresses.UniActionPolicy].map(
        (address) => testClient.getCode({ address })
      )
    )
    expect(bytecodes.every((bytecode) => !!bytecode?.length)).toBeTruthy()
  })

  test.concurrent(
    "should parse a human friendly policy reference value to the hex version expected by the contracts",
    async () => {
      const TWO_THOUSAND_AS_HEX =
        "0x00000000000000000000000000000000000000000000000000000000000007d0"

      expect(parseReferenceValue(BigInt(2000))).toBe(TWO_THOUSAND_AS_HEX)
      expect(parseReferenceValue(2000)).toBe(TWO_THOUSAND_AS_HEX)
      expect(parseReferenceValue("7d0")).toBe(TWO_THOUSAND_AS_HEX)
      expect(
        parseReferenceValue(
          parseReferenceValue(pad(toHex(BigInt(2000)), { size: 32 }))
        )
      ).toBe(TWO_THOUSAND_AS_HEX)
    }
  )

  test.concurrent("should get a universal action policy", async () => {
    const actionConfigData = {
      valueLimitPerUse: BigInt(1000),
      paramRules: {
        length: 2,
        rules: [
          {
            condition: ParamCondition.EQUAL,
            offsetIndex: 0,
            isLimited: true,
            ref: 1000,
            usage: {
              limit: BigInt(1000),
              used: BigInt(10)
            }
          },
          {
            condition: ParamCondition.LESS_THAN,
            offsetIndex: 1,
            isLimited: false,
            ref: 2000,
            usage: {
              limit: BigInt(2000),
              used: BigInt(100)
            }
          }
        ]
      }
    }
    const installUniversalPolicy = policies.to.universalAction(actionConfigData)

    expect(installUniversalPolicy.policy).toEqual(testAddresses.UniActionPolicy)
    expect(installUniversalPolicy.initData).toBeDefined()
  })

  test.concurrent("should get a sudo action policy", async () => {
    const installSudoActionPolicy = policies.sudo
    expect(installSudoActionPolicy.policy).toBeDefined()
    expect(installSudoActionPolicy.initData).toEqual("0x")
  })

  test.concurrent("should get a spending limit policy", async () => {
    const installSpendingLimitPolicy = policies.to.spendingLimits([
      {
        limit: BigInt(1000),
        token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
      }
    ])

    expect(installSpendingLimitPolicy.policy).toBeDefined()
    expect(installSpendingLimitPolicy.initData).toBeDefined()
  })

  test.concurrent(
    "should have valid smartSessionValidator properties",
    async () => {
      const smartSessionValidator = toSmartSessionsValidator({
        account: nexusClient.account,
        signer: eoaAccount
      })
      expect(smartSessionValidator.signMessage).toBeDefined()
      expect(smartSessionValidator.signUserOpHash).toBeDefined()
      expect(smartSessionValidator.address).toBeDefined()
      expect(smartSessionValidator.initData).toBeDefined()
      expect(smartSessionValidator.deInitData).toBeDefined()
      expect(smartSessionValidator.signer).toBeDefined()
      expect(smartSessionValidator.type).toBeDefined()
    }
  )

  test.concurrent(
    "should install sessions module with no init data",
    async () => {
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
        module: sessionsModule
      })
      expect(isInstalledAfter).toBe(true)
    }
  )

  test("should create Counter increment session (USE mode) on installed smart session validator", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: sessionsModule
    })

    expect(isInstalledBefore).toBe(true)

    // session key signer address is declared here
    const sessionRequestedInfo: CreateSessionDataParams[] = [
      {
        sessionPublicKey, // session key signer
        sessionValidatorAddress: SIMPLE_SESSION_VALIDATOR_ADDRESS,
        sessionKeyData: toHex(toBytes(sessionPublicKey)),
        sessionValidAfter: 0,
        sessionValidUntil: 0,
        actionPoliciesInfo: [
          {
            contractAddress: TEST_CONTRACTS.Counter.address, // counter address
            functionSelector: "0x273ea3e3" as Hex, // function selector for increment count
            validUntil: 0,
            validAfter: 0,
            rules: [], // no other rules and conditions applied
            valueLimit: BigInt(0)
          }
        ]
      }
    ]

    const nexusSessionClient = nexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    const createSessionsResponse = await nexusSessionClient.createSessions({
      sessionRequestedInfo
    })

    expect(createSessionsResponse.userOpHash).toBeDefined()
    expect(createSessionsResponse.permissionIds).toBeDefined()
    ;[cachedPermissionId] = createSessionsResponse.permissionIds

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: createSessionsResponse.userOpHash
    })

    expect(receipt.success).toBe(true)
  }, 60000)

  test("should make use of already enabled session (USE mode) to increment a counter using a session key", async () => {
    const counterBefore = await testClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
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

    const useSessionsModule = toSmartSessionsValidator({
      account: smartSessionNexusClient.account,
      signer: sessionKeyAccount,
      moduleData: {
        permissionId: cachedPermissionId
      }
    })

    const useSmartSessionNexusClient = smartSessionNexusClient.extend(
      smartSessionUseActions(useSessionsModule)
    )

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

    expect(userOpHash).toBeDefined()
    const receipt =
      await useSmartSessionNexusClient.waitForUserOperationReceipt({
        hash: userOpHash
      })
    expect(receipt.success).toBe(true)

    const counterAfter = await testClient.readContract({
      address: TEST_CONTRACTS.Counter.address,
      abi: CounterAbi,
      functionName: "getNumber"
    })

    expect(counterAfter).toBe(counterBefore + BigInt(1))
  }, 60000)
})

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
    network = await toNetwork()

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
      address: TEST_CONTRACTS.MockCallee.address,
      abi: MockCalleeAbi,
      client: testClient
    })
    const balUint = 123n
    const balBytes32 = `0x${balUint.toString(16).padStart(64, "0")}`
    const balancesBefore = await mockContract.read.bals([nexusAccountAddress])
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: TEST_CONTRACTS.MockCallee.address,
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
        sessionValidatorAddress: SIMPLE_SESSION_VALIDATOR_ADDRESS,
        sessionKeyData: toHex(toBytes(sessionPublicKey)),
        sessionValidAfter: 0,
        sessionValidUntil: 0,
        actionPoliciesInfo: [
          {
            contractAddress: TEST_CONTRACTS.MockCallee.address, // mock callee address
            functionSelector: parsedFunctionSelector, // addBalance function selector
            validUntil: 0, // 1717001666
            validAfter: 0,
            rules: rules,
            valueLimit: BigInt(0)
          }
        ]
      }
    ]

    const smartSessionNexusClient = nexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    const createSessionsResponse = await smartSessionNexusClient.createSessions(
      { sessionRequestedInfo }
    )

    expect(createSessionsResponse.userOpHash).toBeDefined()
    expect(createSessionsResponse.permissionIds).toBeDefined()
    ;[cachedPermissionId] = createSessionsResponse.permissionIds

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: createSessionsResponse.userOpHash
    })

    expect(receipt.success).toBe(true)

    const isEnabled = await isSessionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)
  }, 60000)

  test("should make use of already enabled session (USE mode) to add balance to MockCallee using a session key", async () => {
    const isEnabled = await isSessionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)

    const mockContract = getContract({
      address: TEST_CONTRACTS.MockCallee.address,
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

    const useSessionsModule = toSmartSessionsValidator({
      account: smartSessionNexusClient.account,
      signer: sessionKeyAccount,
      moduleData: {
        permissionId: cachedPermissionId
      }
    })

    const useSmartSessionNexusClient = smartSessionNexusClient.extend(
      smartSessionUseActions(useSessionsModule)
    )

    const userOpHash = await useSmartSessionNexusClient.useSession({
      account: nexusClient.account,
      actions: [
        {
          target: TEST_CONTRACTS.MockCallee.address,
          value: 0n,
          callData: encodeFunctionData({
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
  }, 60000)
})
