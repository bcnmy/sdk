import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  type PublicClient,
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
import policies from "./Helpers"
import type { CreateSessionDataParams } from "./Types"
import { ParamCondition } from "./Types"
import { smartSessionCreateActions } from "./decorators"
import { toUseSessions } from "./toUseSessions"

describe("modules.smartSessions", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let nexusClient: NexusClient
  let cachedPermissionId: Hex
  let nexusAccountAddress: Hex
  let sessionKeyAccount: Account
  let sessionPublicKey: Address

  beforeAll(async () => {
    network = await toNetwork()

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
      const smartSessionValidator = toUseSessions({
        account: nexusClient.account,
        signer: eoaAccount,
        data: {
          permissionId:
            "0xfcb2f4375207e6abcd89f2cd06c962435405acde8a974d872b373d7c5d557f0a"
        }
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
    "should install smartSessionValidator with no init data",
    async () => {
      const isInstalledBefore = await nexusClient.isModuleInstalled({
        module: {
          type: "validator",
          module: addresses.SmartSession
        }
      })

      if (!isInstalledBefore) {
        const hash = await nexusClient.installModule({
          module: {
            module: addresses.SmartSession,
            type: "validator"
          }
        })

        const { success: installSuccess } =
          await nexusClient.waitForUserOperationReceipt({ hash })
        expect(installSuccess).toBe(true)
      }

      const isInstalledAfter = await nexusClient.isModuleInstalled({
        module: {
          type: "validator",
          module: addresses.SmartSession
        }
      })
      expect(isInstalledAfter).toBe(true)
    }
  )

  test.concurrent(
    "should get stub signature from smartSessionValidator with USE mode",
    async () => {
      const smartSessionValidator = toUseSessions({
        account: nexusClient.account,
        signer: eoaAccount,
        data: {
          permissionId:
            "0xfcb2f4375207e6abcd89f2cd06c962435405acde8a974d872b373d7c5d557f0a"
        }
      })

      const stubSig = await smartSessionValidator.getStubSignature()
      expect(stubSig).toBeDefined()
    }
  )

  test.concurrent(
    "should get actual signature from smartSessionValidator with USE mode",
    async () => {
      const smartSessionValidator = toUseSessions({
        account: nexusClient.account,
        signer: eoaAccount,
        data: {
          permissionId:
            "0xfcb2f4375207e6abcd89f2cd06c962435405acde8a974d872b373d7c5d557f0a"
        }
      })

      const mockUserOpHash =
        "0x1234567890123456789012345678901234567890123456789012345678901234"
      const realSig = await smartSessionValidator.signUserOpHash(mockUserOpHash)
      expect(realSig).toBeDefined()
    }
  )

  test("should create Counter increment session (USE mode) on installed smart session validator", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: {
        type: "validator",
        module: addresses.SmartSession
      }
    })

    expect(isInstalledBefore).toBe(true)

    // session key signer address is declared here
    const sessionRequestedInfo: CreateSessionDataParams[] = [
      {
        sessionPublicKey, // session key signer
        sessionValidatorAddress: TEST_CONTRACTS.SimpleSessionValidator.address,
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

    const nexusSessionClient = nexusClient.extend(smartSessionCreateActions())

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

    const dappNexusClient = await createNexusSessionClient({
      chain,
      accountAddress: nexusClient.account.address,
      signer: sessionKeyAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    const userOpHash = await dappNexusClient.useSession({
      actions: [
        {
          target: TEST_CONTRACTS.Counter.address,
          value: 0n,
          callData: encodeFunctionData({
            abi: CounterAbi,
            functionName: "incrementNumber"
          })
        }
      ],
      data: {
        permissionId: cachedPermissionId
      }
    })

    expect(userOpHash).toBeDefined()
    const receipt = await nexusClient.waitForUserOperationReceipt({
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
