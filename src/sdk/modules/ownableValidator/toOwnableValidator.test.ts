import {
  getAddOwnableExecutorOwnerAction,
  getExecuteOnOwnedAccountAction,
  getOwnableValidatorSignature
} from "@rhinestone/module-sdk"
import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  type PublicClient,
  type WalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAddress,
  parseAbi,
  toHex,
  zeroAddress
} from "viem"
import { waitForTransactionReceipt } from "viem/actions"
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
import type { NexusAccount } from "../../account"
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import { parseModuleTypeId } from "../../clients/decorators/erc7579/supportsModule"
import { K1_VALIDATOR_ADDRESS } from "../../constants"
import { toK1Validator } from "../k1Validator/toK1Validator"
import type { Module } from "../utils/Types"
import { type OwnableActions, ownableActions } from "./decorators"
import { toOwnableValidator } from "./toOwnableValidator"

describe("modules.ownableValidator.dx", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let userTwo: LocalAccount
  let userThree: LocalAccount

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    userTwo = getTestAccount(1)
    userThree = getTestAccount(2)

    testClient = toTestClient(chain, getTestAccount(5))
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should demonstrate ownables module dx", async () => {
    /**
     * This test demonstrates the creation and use of an ownables module for multi-signature functionality:
     *
     * 1. Setup and Installation:
     *    - Create a Nexus client for the main account
     *    - Install the ownables module on the smart contract account
     *
     * 2. Multi-Signature Transaction:
     *    - Prepare a user operation (withdrawal) that requires multiple signatures
     *    - Collect signatures from required owners
     *    - Execute the multi-sig transaction
     *
     * This test showcases how the ownables module enables multi-signature functionality
     * on a smart contract account, ensuring that certain actions require approval from
     * multiple designated owners.
     */

    // Create a Nexus client for the main account (eoaAccount)
    // This client will be used to interact with the smart contract account
    const nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    // Fund the account and deploy the smart contract wallet
    // This is just a reminder to fund the account and deploy the smart contract wallet
    await fundAndDeployClients(testClient, [nexusClient])

    // Create an ownables module with the following configuration:
    // - Threshold: 2 (requires 2 signatures for approval)
    // - Owners: userThree and userTwo
    const ownableModule = toOwnableValidator({
      account: nexusClient.account,
      signer: eoaAccount,
      moduleInitArgs: {
        threshold: 2n,
        owners: [userThree.address, userTwo.address]
      }
    })

    // Install the ownables module on the Nexus client's smart contract account
    const hash = await nexusClient.installModule({
      module: ownableModule.moduleInitData
    })

    // Extend the Nexus client with ownable-specific actions
    // This allows the client to use the new module's functionality
    const ownableNexusClient = nexusClient.extend(ownableActions(ownableModule))

    // Wait for the module installation transaction to be mined and check its success
    const { success } = await ownableNexusClient.waitForUserOperationReceipt({
      hash
    })

    // Prepare a user operation to withdraw 1 wei to userTwo
    // This demonstrates a simple transaction that requires multi-sig approval
    // @ts-ignore
    const withdrawalUserOp = await ownableNexusClient.prepareUserOperation({
      calls: [
        {
          to: userTwo.address,
          value: 1n
        }
      ]
    })

    // Get the hash of the user operation
    // This hash will be signed by the required owners
    const withdrawalUserOpHash =
      // @ts-ignore
      await nexusClient.account.getUserOpHash(withdrawalUserOp)

    // Collect signatures from both required owners (userTwo and userThree)
    const signatures = await Promise.all(
      [userTwo, userThree].map(async (signer) => {
        return signer.signMessage({
          message: { raw: withdrawalUserOpHash }
        })
      })
    )

    // Combine the signatures and set them on the user operation
    // The order of signatures should match the order of owners in the module configuration
    withdrawalUserOp.signature = await ownableNexusClient.prepareSignatures({
      signatures
    })
    // Send the user operation with the collected signatures
    const userOpHash = await nexusClient.sendUserOperation(withdrawalUserOp)

    // Wait for the user operation to be mined and check its success
    const { success: userOpSuccess } =
      await ownableNexusClient.waitForUserOperationReceipt({ hash: userOpHash })

    // Verify that the multi-sig transaction was successful
    expect(userOpSuccess).toBe(true)
  })
})

describe("modules.ownables", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: Account
  let nexusClient: NexusClient
  let ownableNexusClient: NexusClient & OwnableActions<NexusAccount>
  let recipient: LocalAccount
  let recipientAddress: Address
  let userThree: LocalAccount
  let userThreeAddress: Address
  let ownableModule: Module

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    recipient = getTestAccount(1)
    userThree = getTestAccount(2)

    recipientAddress = recipient.address
    userThreeAddress = userThree.address
    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    await fundAndDeployClients(testClient, [nexusClient])

    ownableModule = toOwnableValidator({
      account: nexusClient.account,
      signer: eoaAccount,
      moduleInitArgs: {
        threshold: 1n,
        owners: [eoaAccount.address]
      }
    })
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should install ownable validator and perform operations", async () => {
    const installHash = await nexusClient.installModule({
      module: ownableModule.moduleInitData
    })

    // @ts-ignore
    ownableNexusClient = nexusClient.extend(ownableActions(ownableModule))

    const { success: installSuccess } =
      await ownableNexusClient.waitForUserOperationReceipt({
        hash: installHash
      })

    expect(installSuccess).toBe(true)
  })

  test("should add accountTwo as owner", async () => {
    const hash = await ownableNexusClient.addOwner({
      owner: userThreeAddress
    })
    expect(hash).toBeDefined()
    const receipt = await ownableNexusClient.waitForUserOperationReceipt({
      hash
    })
    expect(receipt.success).toBe(true)

    const owners = await ownableNexusClient.getOwners()
    expect(owners).toContain(userThreeAddress)
  })

  test("should remove an owner", async () => {
    const removeOwnerTx = await ownableNexusClient.getRemoveOwnerTx({
      owner: userThreeAddress
    })

    const userOp = await nexusClient.prepareUserOperation({
      calls: [removeOwnerTx]
    })
    const dummyUserOpHash = await nexusClient.account.getUserOpHash(userOp)

    const signature1 = await eoaAccount?.signMessage?.({
      message: { raw: dummyUserOpHash }
    })
    const signature2 = await recipient?.signMessage?.({
      message: { raw: dummyUserOpHash }
    })
    const multiSignature = encodePacked(
      ["bytes", "bytes"],
      [signature1 ?? "0x", signature2 ?? "0x"]
    )
    userOp.signature = multiSignature
    const userOpHash = await nexusClient.sendUserOperation(userOp)
    // @note Can also use the removeOwner decorator but it requires a signature override and the user op nonce,
    // otherwise it will try to use a different nonce and siganture will be invalid
    // const userOpHash = await ownableNexusClient.removeOwner({
    //   account: nexusClient.account,
    //   owner: recipientAddress,
    //   signatureOverride: multiSignature,
    //   nonce: userOp.nonce
    // })
    expect(userOpHash).toBeDefined()
    const { success: userOpSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash: userOpHash })
    expect(userOpSuccess).toBe(true)
  })

  test("should add owner and set threshold to 2", async () => {
    const isInstalled = await nexusClient.isModuleInstalled({
      module: {
        address: ownableModule.address,
        type: "validator"
      }
    })
    expect(isInstalled).toBe(true)

    // Add owner
    const userOpHash1 = await ownableNexusClient.addOwner({
      owner: recipientAddress
    })
    expect(userOpHash1).toBeDefined()
    const receipt = await ownableNexusClient.waitForUserOperationReceipt({
      hash: userOpHash1
    })
    expect(receipt.success).toBe(true)

    // Set threshold
    const userOpHash2 = await ownableNexusClient.setThreshold({
      threshold: 2
    })
    expect(userOpHash2).toBeDefined()
    const { success: userOpSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash: userOpHash2 })
    expect(userOpSuccess).toBe(true)
    const newThreshold = await ownableNexusClient.getThreshold()
    expect(newThreshold).toBe(2)
  }, 90000)

  test("should require 2 signatures to send user operation", async () => {
    expect(nexusClient.account.getModule().address).toBe(ownableModule.address)

    const userOp = await nexusClient.prepareUserOperation({
      calls: [
        {
          to: zeroAddress,
          data: "0x"
        }
      ]
    })

    const userOpHash = await nexusClient.account.getUserOpHash(userOp)
    const signature1 = await eoaAccount?.signMessage?.({
      message: { raw: userOpHash }
    })
    const signature2 = await recipient?.signMessage?.({
      message: { raw: userOpHash }
    })
    const multiSignature = encodePacked(
      ["bytes", "bytes"],
      [signature1 ?? "0x", signature2 ?? "0x"]
    )
    userOp.signature = multiSignature
    const userOperationHashResponse =
      await nexusClient.sendUserOperation(userOp)
    expect(userOpHash).toBeDefined()
    const { success: userOpSuccess } =
      await nexusClient.waitForUserOperationReceipt({
        hash: userOperationHashResponse
      })
    expect(userOpSuccess).toBe(true)
  })

  test("should uninstall ownable validator with 2 signatures", async () => {
    const [installedValidators] = await nexusClient.getInstalledValidators()
    const prevModule = await nexusClient.getPreviousModule({
      module: {
        address: ownableModule.address,
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
        getAddress(ownableModule.address),
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

    const signature1 = await eoaAccount?.signMessage?.({
      message: { raw: userOpHash }
    })
    const signature2 = (await recipient?.signMessage?.({
      message: { raw: userOpHash }
    })) as Hex
    const multiSignature = getOwnableValidatorSignature({
      signatures: [signature1 ?? "0x", signature2 ?? "0x"]
    })
    userOp.signature = multiSignature
    const uninstallHash = await nexusClient.sendUserOperation(userOp)
    // const uninstallHash = await nexusClient.uninstallModule({
    //   module: {
    //     address: ownableModule.address,
    //     type: "validator",
    //     data: "0x"
    //   },
    //   signatureOverride: multiSignature,
    //   nonce: userOp.nonce
    // })
    expect(uninstallHash).toBeDefined()
    const { success: userOpSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash: uninstallHash })
    expect(userOpSuccess).toBe(true)
    const [installedValidatorsAfter] =
      await nexusClient.getInstalledValidators()
    expect(installedValidatorsAfter).toEqual([K1_VALIDATOR_ADDRESS])
  })
})

describe("modules.ownableExecutor", async () => {
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
  let k1Module: Module
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

    const k1Module = toK1Validator({
      signer: eoaAccount,
      accountAddress: nexusClient.account.address
    })

    nexusClient.account.setModule(k1Module)
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should install OwnableExecutor module", async () => {
    const isInstalled = await nexusClient.isModuleInstalled({
      module: {
        type: "executor",
        address: testAddresses.OwnableExecutor
      }
    })
    expect(isInstalled).toBe(false)

    const userOpHash = await nexusClient.installModule({
      module: {
        type: "executor",
        address: testAddresses.OwnableExecutor,
        initData: encodePacked(["address"], [eoaAccount.address])
      }
    })
    expect(userOpHash).toBeDefined()
    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })
    expect(receipt.success).toBe(true)

    const isInstalledAfter = await nexusClient.isModuleInstalled({
      module: {
        type: "executor",
        address: testAddresses.OwnableExecutor
      }
    })
    expect(isInstalledAfter).toBe(true)
  })

  test("should add another EOA as executor", async () => {
    const execution = await getAddOwnableExecutorOwnerAction({
      owner: recipientAddress,
      client: nexusClient.account.client as PublicClient,
      account: {
        address: nexusClient.account.address,
        type: "nexus",
        deployedOnChains: []
      }
    })
    const userOpHash = await nexusClient.sendTransaction({
      calls: [
        {
          to: testAddresses.OwnableExecutor,
          data: execution.callData,
          value: 0n
        }
      ]
    })
    expect(userOpHash).toBeDefined()
    const masterClient = nexusClient.account.client as MasterClient
    const owners = await masterClient.readContract({
      address: testAddresses.OwnableExecutor,
      abi: parseAbi([
        "function getOwners(address account) external view returns (address[])"
      ]),
      functionName: "getOwners",
      args: [nexusClient.account.address]
    })
    expect(owners).toContain(recipientAddress)
  })

  test("added executor EOA should execute user operation on smart account", async () => {
    const executeOnOwnedAccountExecution = getExecuteOnOwnedAccountAction({
      execution: {
        target: zeroAddress,
        callData: toHex("0x"),
        value: 0n,
        to: zeroAddress,
        data: "0x"
      },
      ownedAccount: nexusClient.account.address
    })

    const client = nexusClient.account.client as WalletClient
    const hash = await client.sendTransaction({
      account: recipient,
      to: testAddresses.OwnableExecutor,
      data: executeOnOwnedAccountExecution.callData,
      chain,
      value: 0n
    })

    const receipt = await waitForTransactionReceipt(
      nexusClient.account.client as PublicClient,
      { hash }
    )
    expect(receipt.status).toBe("success")
  })
})
