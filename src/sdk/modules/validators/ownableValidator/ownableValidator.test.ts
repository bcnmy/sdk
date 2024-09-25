import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAddress,
  zeroAddress
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
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
import { parseModuleTypeId } from "../../../clients/decorators/erc7579/supportsModule"
import {
  type ToK1ValidatorModuleReturnType,
  toK1ValidatorModule
} from "../k1Validator/toK1ValidatorModule"
import {
  type ToOwnableValidatorModuleReturnType,
  toOwnableValidatorModule
} from "./toOwnableValidatorModule"

describe("modules.ownableValidator", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let account: Account
  let nexusClient: NexusClient
  let nexusAccountAddress: Address
  let recipient: Account
  let recipientAddress: Address
  let ownableValidatorModule: ToOwnableValidatorModuleReturnType
  let k1ValidatorModule: ToK1ValidatorModuleReturnType
  beforeAll(async () => {
    network = await toNetwork("FILE_LOCALHOST")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    account = getTestAccount(0)
    recipient = getTestAccount(1)
    recipientAddress = recipient.address

    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createNexusClient({
      signer: account,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await fundAndDeployClients(testClient, [nexusClient])

    ownableValidatorModule = await toOwnableValidatorModule({
      nexusAccountAddress: nexusClient.account.address,
      client: nexusClient.account.client as PublicClient,
      initData: encodeAbiParameters(
        [
          { name: "threshold", type: "uint256" },
          { name: "owners", type: "address[]" }
        ],
        [BigInt(2), [account.address, recipient.address]]
      ),
      deInitData: "0x"
    })

    k1ValidatorModule = await toK1ValidatorModule({
      nexusAccountAddress: nexusClient.account.address,
      client: nexusClient.account.client as PublicClient,
      initData: encodePacked(["address"], [account.address]),
      deInitData: encodePacked(["address"], [account.address])
    })
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should return values if module not installed", async () => {
    const owners = await ownableValidatorModule.getOwners()
    const threshold = await ownableValidatorModule.getThreshold()
    expect(owners).toEqual([])
    expect(threshold).toBe(0)
  })

  test("should install ownable validator and perform operations", async () => {
    // Install ownable validator
    const installHash = await nexusClient.installModule({
      module: {
        address: TEST_CONTRACTS.OwnableValidator.address,
        type: "validator",
        data: encodeAbiParameters(
          [
            { name: "threshold", type: "uint256" },
            { name: "owners", type: "address[]" }
          ],
          [BigInt(1), [account.address]]
        )
      }
    })
    const { success: installSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash: installHash })
    expect(installSuccess).toBe(true)
  })

  test("should add accountTwo as owner", async () => {
    const addOwnerTx = await ownableValidatorModule.getAddOwnerTx(
      recipient.address
    )

    const transactionHash = await nexusClient.sendTransaction({
      calls: [addOwnerTx]
    })
    expect(transactionHash).toBeDefined()
    const receipt = await testClient.waitForTransactionReceipt({
      hash: transactionHash
    })
    expect(receipt.status).toBe("success")

    const owners = await ownableValidatorModule.getOwners()
    expect(owners).toContain(recipient.address)
  })

  test("should set threshold to 2", async () => {
    const isInstalled = await nexusClient.isModuleInstalled({
      module: {
        address: TEST_CONTRACTS.OwnableValidator.address,
        type: "validator"
      }
    })
    expect(isInstalled).toBe(true)
    // Set threshold
    const setThresholdTx = ownableValidatorModule.getSetThresholdTx(2)
    const userOpHash = await nexusClient.sendTransaction({
      calls: [setThresholdTx]
    })
    expect(userOpHash).toBeDefined()
    const newThreshold = await ownableValidatorModule.getThreshold()
    expect(newThreshold).toBe(2)
  }, 90000)

  test("should need 2 signatures to send a user operation", async () => {
    const activeValidationModule =
      nexusClient.account.getActiveValidationModule()
    expect(activeValidationModule.address).toBe(addresses.K1Validator)

    nexusClient.account.setActiveValidationModule(ownableValidatorModule)
    const activeValidationModuleAfter =
      nexusClient.account.getActiveValidationModule()
    expect(activeValidationModuleAfter.address).toBe(
      TEST_CONTRACTS.OwnableValidator.address
    )

    const dummyUserOp = await nexusClient.prepareUserOperation({
      calls: [
        {
          to: zeroAddress,
          data: "0x"
        },
        {
          to: zeroAddress,
          data: "0x"
        }
      ]
    })
    const dummyUserOpHash = await nexusClient.account.getUserOpHash(dummyUserOp)
    const signature1 = await account?.signMessage?.({
      message: { raw: dummyUserOpHash }
    })
    const signature2 = await recipient?.signMessage?.({
      message: { raw: dummyUserOpHash }
    })
    const multiSignature = encodePacked(
      ["bytes", "bytes"],
      [signature1 ?? "0x", signature2 ?? "0x"]
    )
    const userOpHash = await nexusClient.sendUserOperation({
      calls: [
        {
          to: zeroAddress,
          data: "0x"
        },
        {
          to: zeroAddress,
          data: "0x"
        }
      ],
      signature: multiSignature
    })
    expect(userOpHash).toBeDefined()
    const { success: userOpSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash: userOpHash })
    expect(userOpSuccess).toBe(true)
  })

  test("should uninstall ownable validator", async () => {
    const [installedValidators] = await nexusClient.getInstalledValidators({})
    const prevModule = await nexusClient.getPreviousModule({
      module: {
        address: TEST_CONTRACTS.OwnableValidator.address,
        type: "validator"
      },
      installedValidators
    })
    const deInitData = encodeAbiParameters(
      [
        { name: "prev", type: "address" },
        { name: "disableModuleData", type: "bytes" }
      ],
      [prevModule, "0x"]
    )

    const uninstallCallData = encodeFunctionData({
      abi: [
        {
          name: "uninstallModule",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            {
              type: "uint256",
              name: "moduleTypeId"
            },
            {
              type: "address",
              name: "module"
            },
            {
              type: "bytes",
              name: "deInitData"
            }
          ],
          outputs: []
        }
      ],
      functionName: "uninstallModule",
      args: [
        parseModuleTypeId("validator"),
        getAddress(TEST_CONTRACTS.OwnableValidator.address),
        deInitData
      ]
    })

    const userOp = await nexusClient.prepareUserOperation({
      calls: [
        {
          to: nexusClient.account.address,
          data: uninstallCallData
        }
      ]
    })
    const userOpHash = await nexusClient.account.getUserOpHash(userOp)
    expect(userOpHash).toBeDefined()

    const signature1 = await account?.signMessage?.({
      message: { raw: userOpHash }
    })
    const signature2 = (await recipient?.signMessage?.({
      message: { raw: userOpHash }
    })) as Hex
    const multiSignature = encodePacked(
      ["bytes", "bytes"],
      [signature1 ?? "0x", signature2 ?? "0x"]
    )
    const uninstallHash = await nexusClient.uninstallModule({
      module: {
        address: TEST_CONTRACTS.OwnableValidator.address,
        type: "validator",
        data: deInitData
      },
      signatureOverride: multiSignature
    })
    expect(uninstallHash).toBeDefined()
    const { success: userOpSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash: uninstallHash })
    expect(userOpSuccess).toBe(true)
  })
})
