import { getOwnableValidatorSignature } from "@rhinestone/module-sdk"
import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAddress,
  zeroAddress
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
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
  createSmartAccountClient
} from "../../clients/createSmartAccountClient"
import { parseModuleTypeId } from "../../clients/decorators/erc7579/supportsModule"
import { k1ValidatorAddress } from "../../constants"
import type { Module } from "../utils/Types"
import { type OwnableActions, ownableActions } from "./decorators"
import { toOwnableValidator } from "./toOwnableValidator"

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

    nexusClient = await createSmartAccountClient({
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
    expect(installedValidatorsAfter).toEqual([k1ValidatorAddress])
  })
})
