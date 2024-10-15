import { getOwnableValidatorSignature } from "@rhinestone/module-sdk"
import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
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
import addresses from "../../__contracts/addresses"
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import { parseModuleTypeId } from "../../clients/decorators/erc7579/supportsModule"
import { type ToK1ReturnType, toK1 } from "../k1/toK1"
import { addOwner, ownableActions, setThreshold } from "./decorators"
import { type OwnableModule, toOwnables } from "./toOwnables"

describe("modules.ownableValidator", async () => {
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
  let ownableModule: OwnableModule
  let k1Module: ToK1ReturnType

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

    ownableModule = toOwnables({
      account: nexusClient.account,
      signer: eoaAccount,
      initArgs: { threshold: 1n, owners: [eoaAccount.address] }
    })

    k1Module = toK1({
      accountAddress: nexusClient.account.address,
      signer: eoaAccount
    })
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should be able to extend the client, and activate the module", async () => {
    const ownableNexusClient = nexusClient.extend(ownableActions())
    expect(Object.keys(ownableNexusClient)).toContain("addOwner")
    expect(ownableNexusClient?.account?.getModule().address).toBe(
      k1Module.address
    )
  })

  test("should return values if module not installed", async () => {
    const owners = await ownableModule.getOwners()
    const threshold = await ownableModule.getThreshold()
    expect(owners).toEqual([])
    expect(threshold).toBe(0)
  })

  test("should install ownable validator and perform operations", async () => {
    const ownableNexusClient = nexusClient.extend(ownableActions())

    const installHash = await ownableNexusClient.install({
      account: nexusClient.account,
      module: {
        module: ownableModule.address,
        type: "validator",
        initData: ownableModule.initData
      }
    })

    // const installHash = await ownableNexusClient.installModule({
    //   module: {
    //     module: ownableModule.address,
    //     type: "validator",
    //     initData: ownableModule.initData
    //   }
    // })

    const { success: installSuccess } =
      await ownableNexusClient.waitForUserOperationReceipt({
        hash: installHash
      })

    expect(installSuccess).toBe(true)

    // ownableNexusClient.account.setModule(ownableModule)
  })

  test("should add accountTwo as owner", async () => {
    const ownableNexusClient = nexusClient.extend(ownableActions())

    const userOpHash = await ownableNexusClient.addOwner({
      account: nexusClient.account,
      owner: recipientAddress
    })
    expect(userOpHash).toBeDefined()
    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })
    expect(receipt.success).toBe(true)

    const owners = await ownableModule.getOwners()
    expect(owners).toContain(recipient.address)
  })

  test("should remove an owner", async () => {
    expect(nexusClient.account.getModule().address).toBe(ownableModule.address)

    const ownableNexusClient = nexusClient.extend(ownableActions())

    const removeOwnerTx = await ownableModule.getRemoveOwnerTx(
      recipient.address
    )

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
        module: ownableModule.address,
        type: "validator"
      }
    })
    expect(isInstalled).toBe(true)

    // Add owner
    const userOpHash1 = await addOwner(nexusClient, {
      account: nexusClient.account,
      owner: recipientAddress
    })
    expect(userOpHash1).toBeDefined()
    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash1
    })
    expect(receipt.success).toBe(true)

    // Set threshold
    const userOpHash2 = await setThreshold(nexusClient, {
      account: nexusClient.account,
      threshold: 2
    })
    expect(userOpHash2).toBeDefined()
    const { success: userOpSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash: userOpHash2 })
    expect(userOpSuccess).toBe(true)
    const newThreshold = await ownableModule.getThreshold()
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
        module: ownableModule.address,
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
    expect(installedValidatorsAfter).toEqual([addresses.K1Validator])
  })
})
