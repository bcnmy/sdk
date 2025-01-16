import {
  http,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  encodeFunctionData,
  pad,
  toHex
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
import { SmartSessionMode, getUniversalActionPolicy } from "../../constants"
import { parseReferenceValue } from "../utils/Helpers"
import type { Module } from "../utils/Types"
import { abiToPoliciesInfo, parse, stringify, toActionConfig } from "./Helpers"
import type { CreateSessionDataParams, SessionData } from "./Types"
import { ParamCondition } from "./Types"
import { smartSessionCreateActions, smartSessionUseActions } from "./decorators"
import { toSmartSessionsValidator } from "./toSmartSessionsValidator"

describe("modules.smartSessions", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let nexusClient: NexusClient
  let cachedSessionData: string // Session data to be stored by the dApp
  let sessionKeyAccount: LocalAccount
  let sessionPublicKey: Address

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

  test("should convert an ABI to a contract whitelist", async () => {
    const contractWhitelist = abiToPoliciesInfo({
      abi: CounterAbi,
      contractAddress: testAddresses.Counter
    })

    expect(contractWhitelist).toBeDefined()

    // Verify the structure matches all CounterAbi functions
    expect(contractWhitelist).toEqual([
      {
        contractAddress: testAddresses.Counter,
        functionSelector: "0x871cc9d4", // decrementNumber
        rules: []
      },
      {
        contractAddress: testAddresses.Counter,
        functionSelector: "0xf2c9ecd8", // getNumber
        rules: []
      },
      {
        contractAddress: testAddresses.Counter,
        functionSelector: "0x273ea3e3", // incrementNumber
        rules: []
      },
      {
        contractAddress: testAddresses.Counter,
        functionSelector: "0x12467434", // revertOperation
        rules: []
      }
    ])

    // Verify the length matches the number of functions in CounterAbi
    expect(contractWhitelist).toHaveLength(4)
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
    const installUniversalPolicy = getUniversalActionPolicy(
      toActionConfig(actionConfigData)
    )

    expect(installUniversalPolicy.policy).toEqual(testAddresses.UniActionPolicy)
    expect(installUniversalPolicy.initData).toBeDefined()
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

  test("should install sessions module with no init data", async () => {
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
  })

  test("should create Counter increment session (USE mode) on installed smart session validator", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: sessionsModule
    })

    expect(isInstalledBefore).toBe(true)

    // session key signer address is declared here
    const sessionRequestedInfo: CreateSessionDataParams[] = [
      {
        sessionPublicKey, // session key signer
        actionPoliciesInfo: [
          {
            contractAddress: testAddresses.Counter, // counter address
            functionSelector: "0x273ea3e3" as Hex, // function selector for increment count
            sudo: true
          }
        ]
      }
    ]

    const nexusSessionClient = nexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    const createSessionsResponse = await nexusSessionClient.grantPermission({
      sessionRequestedInfo
    })

    expect(createSessionsResponse.userOpHash).toBeDefined()
    expect(createSessionsResponse.permissionIds).toBeDefined()

    const sessionData: SessionData = {
      granter: nexusClient.account.address,
      description: `Session to increment a counter for ${testAddresses.Counter}`,
      sessionPublicKey,
      moduleData: {
        permissionIds: createSessionsResponse.permissionIds,
        action: createSessionsResponse.action,
        mode: SmartSessionMode.USE,
        sessions: createSessionsResponse.sessions
      }
    }

    cachedSessionData = stringify(sessionData)

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: createSessionsResponse.userOpHash
    })

    expect(receipt.success).toBe(true)
  }, 200000)

  test("should make use of already enabled session (USE mode) to increment a counter using a session key", async () => {
    if (!cachedSessionData) {
      throw new Error("Session data not found")
    }

    const counterBefore = await testClient.readContract({
      address: testAddresses.Counter,
      abi: CounterAbi,
      functionName: "getNumber"
    })

    const parsedSessionData = parse(cachedSessionData) as SessionData

    const smartSessionNexusClient = await createSmartAccountClient({
      chain,
      accountAddress: nexusClient.account.address,
      signer: sessionKeyAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      useTestBundler: true
    })

    const usePermissionsModule = toSmartSessionsValidator({
      account: smartSessionNexusClient.account,
      signer: sessionKeyAccount,
      moduleData: parsedSessionData.moduleData
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
      address: testAddresses.Counter,
      abi: CounterAbi,
      functionName: "getNumber"
    })

    expect(counterAfter).toBe(counterBefore + BigInt(1))
  }, 200000)
})
