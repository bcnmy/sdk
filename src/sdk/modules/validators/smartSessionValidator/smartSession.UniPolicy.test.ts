import {
  http,
  type AbiFunction,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  encodeFunctionData,
  encodePacked,
  getContract,
  slice,
  toBytes,
  toFunctionSelector,
  toHex
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { parseReferenceValue } from "../.."
// import { MockTokenAbi } from "../../../../test/__contracts/abi"
import { MockCalleeAbi } from "../../../../test/__contracts/abi/MockCalleeAbi"
import { TEST_CONTRACTS } from "../../../../test/callDatas"
import { toNetwork } from "../../../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../../../test/testUtils"
import addresses from "../../../__contracts/addresses"
import {
  type NexusClient,
  createNexusClient
} from "../../../clients/createNexusClient"
import { isPermissionEnabled } from "./Helper"
import { type CreateSessionDataParams, ParamCondition } from "./Types"
import { smartSessionValidatorActions } from "./decorators"
import { toSmartSessionValidatorModule } from "./tosmartSessionValidatorModule"

describe("modules.smartSessionValidator.write", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: Account
  let nexusClient: NexusClient
  let nexusAccountAddress: Address
  let recipient: Account
  let recipientAddress: Address
  let cachedPermissionId: Hex

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    recipient = getTestAccount(1)
    recipientAddress = recipient.address

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
    const { status } = await testClient.waitForTransactionReceipt({ hash })
    expect(status).toBe("success")
    const balanceAfter = await mockContract.read.bals([nexusAccountAddress])
    expect(balanceAfter[0]).toBeGreaterThan(balancesBefore[0])
  }, 90000)

  test("should install smartSessionValidator with no init data", async () => {
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
  })

  test("should create MockCallee add balance session (USE mode) on installed smart session validator", async () => {
    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: {
        type: "validator",
        module: addresses.SmartSession
      }
    })

    expect(isInstalledBefore).toBe(true)

    // make EOA owner of SA session key as well
    const sessionKeyEOA = eoaAccount.address

    const functionSelector = "addBalance(address,uint256,bytes32)"

    const unparsedFunctionSelector = functionSelector as AbiFunction | string
    const parsedFunctionSelector = slice(
      toFunctionSelector(unparsedFunctionSelector),
      0,
      4
    )

    console.log(
      "nexus account addresss parsed",
      parseReferenceValue(nexusAccountAddress)
    )

    const maxUintDeposit = 123456n
    const minBytes32Deposit = `0x${maxUintDeposit
      .toString(16)
      .padStart(64, "0")}`

    const rules = [
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

    const sessionRequestedInfo: CreateSessionDataParams = {
      sessionPublicKey: sessionKeyEOA,
      sessionValidatorAddress: TEST_CONTRACTS.SimpleSessionValidator.address,
      sessionKeyData: toHex(toBytes(sessionKeyEOA)),
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

    const smartSessionNexusClient = nexusClient.extend(
      smartSessionValidatorActions()
    )

    const createSessionsResponse = await smartSessionNexusClient.createSessions(
      {
        account: nexusClient.account,
        sessionRequestedInfo: [sessionRequestedInfo]
      }
    )

    expect(createSessionsResponse.userOpHash).toBeDefined()
    expect(createSessionsResponse.permissionIds).toBeDefined()

    const permissionIds = createSessionsResponse.permissionIds
    expect(permissionIds.length).toBe(1)
    const permissionId = permissionIds[0]
    cachedPermissionId = permissionId

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: createSessionsResponse.userOpHash
    })

    expect(receipt.success).toBe(true)

    const isEnabled = await isPermissionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: permissionId
    })
    expect(isEnabled).toBe(true)
  }, 60000)

  test("should make use of already enabled session (USE mode) to add balance to MockCallee using a session key", async () => {
    const isEnabled = await isPermissionEnabled({
      client: nexusClient.account.client as PublicClient,
      accountAddress: nexusClient.account.address,
      permissionId: cachedPermissionId
    })
    expect(isEnabled).toBe(true)

    const smartSessionValidator = await toSmartSessionValidatorModule({
      client: nexusClient.account.client as PublicClient,
      initData: encodePacked(["address"], [eoaAccount.address]),
      deInitData: "0x",
      nexusAccountAddress: nexusClient.account.address,
      activePermissionId: cachedPermissionId
    })

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
    console.log("balancesBefore", balancesBefore)

    // helpful for out of range test. If time range limit has been provided in the policy.
    // await testClient.setNextBlockTimestamp({
    //   timestamp: 9727001666n
    // })

    // set active validation module
    nexusClient.account.setActiveModule(smartSessionValidator)

    const smartSessionNexusClient = nexusClient.extend(
      smartSessionValidatorActions()
    )

    // Todo: Review target , value, callData naming vs to, value, data for consistency
    const userOpHash = await smartSessionNexusClient.useSession({
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
      ],
      permissionId: cachedPermissionId
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
