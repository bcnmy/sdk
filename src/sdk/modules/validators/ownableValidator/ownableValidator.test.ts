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
import { addOwner, ownableValidatorActions, setThreshold } from "./decorators"
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
  let eoaAccount: Account
  let nexusClient: NexusClient
  let nexusAccountAddress: Address
  let recipient: Account
  let recipientAddress: Address
  let ownableValidatorModule: ToOwnableValidatorModuleReturnType
  let k1ValidatorModule: ToK1ValidatorModuleReturnType

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

    ownableValidatorModule = toOwnableValidatorModule({
      account: nexusClient.account,
      signer: eoaAccount
    })

    k1ValidatorModule = toK1ValidatorModule({
      accountAddress: nexusClient.account.address,
      signer: eoaAccount
    })
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should be able to extend the client", async () => {
    const ownableNexusClient = nexusClient.extend(ownableValidatorActions())
    expect(Object.keys(ownableNexusClient)).toContain("addOwner")
  })

  test("should return values if module not installed", async () => {
    const owners = await ownableValidatorModule.getOwners()
    const threshold = await ownableValidatorModule.getThreshold()
    expect(owners).toEqual([])
    expect(threshold).toBe(0)
  })

  test("should install ownable validator and perform operations", async () => {
    console.log("eoaAccount.address", eoaAccount.address)
    console.log(
      "ownableValidatorModule.address",
      ownableValidatorModule.address
    )

    const installHash = await nexusClient.installModule({
      module: {
        address: ownableValidatorModule.address,
        type: "validator",
        data: encodeAbiParameters(
          [
            { name: "threshold", type: "uint256" },
            { name: "owners", type: "address[]" }
          ],
          [BigInt(1), [eoaAccount.address]]
        )
      }
    })
    const { success: installSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash: installHash })
    expect(installSuccess).toBe(true)

    nexusClient.account.setActiveModule(ownableValidatorModule)
    console.log(nexusClient.account.getActiveModule().address)
  })

  test("should add accountTwo as owner", async () => {
    const ownableNexusClient = nexusClient.extend(ownableValidatorActions())

    const userOpHash = await ownableNexusClient.addOwner({
      account: nexusClient.account,
      owner: recipientAddress
    })
    expect(userOpHash).toBeDefined()
    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })
    expect(receipt.success).toBe(true)

    const owners = await ownableValidatorModule.getOwners()
    expect(owners).toContain(recipient.address)
  })

  test("should remove an owner", async () => {
    expect(nexusClient.account.getActiveModule().address).toBe(
      ownableValidatorModule.address
    )

    const ownableNexusClient = nexusClient.extend(ownableValidatorActions())

    const removeOwnerTx = await ownableValidatorModule.getRemoveOwnerTx(
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
    const userOpHash = await ownableNexusClient.removeOwner({
      account: nexusClient.account,
      owner: recipientAddress,
      signatureOverride: multiSignature
    })
    expect(userOpHash).toBeDefined()
    const { success: userOpSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash: userOpHash })
    expect(userOpSuccess).toBe(true)
  })

  test("should add owner and set threshold to 2", async () => {
    const isInstalled = await nexusClient.isModuleInstalled({
      module: {
        address: ownableValidatorModule.address,
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
    const newThreshold = await ownableValidatorModule.getThreshold()
    expect(newThreshold).toBe(2)
  }, 90000)

  test("should require 2 signatures to send user operation", async () => {
    expect(nexusClient.account.getActiveModule().address).toBe(
      ownableValidatorModule.address
    )

    const dummyUserOp = await nexusClient.prepareUserOperation({
      calls: [
        {
          to: zeroAddress,
          data: "0x"
        }
      ]
    })

    const dummyUserOpHash = await nexusClient.account.getUserOpHash(dummyUserOp)
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
    const userOpHash = await nexusClient.sendUserOperation({
      calls: [
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

  test("should uninstall ownable validator with 2 signatures", async () => {
    const [installedValidators] = await nexusClient.getInstalledValidators()
    console.log("installedValidators", installedValidators)
    const prevModule = await nexusClient.getPreviousModule({
      module: {
        address: ownableValidatorModule.address,
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
        getAddress(ownableValidatorModule.address),
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
    const uninstallHash = await nexusClient.uninstallModule({
      module: {
        address: ownableValidatorModule.address,
        type: "validator",
        data: "0x"
      },
      signatureOverride: multiSignature
    })
    expect(uninstallHash).toBeDefined()
    const { success: userOpSuccess } =
      await nexusClient.waitForUserOperationReceipt({ hash: uninstallHash })
    expect(userOpSuccess).toBe(true)
    const [installedValidatorsAfter] =
      await nexusClient.getInstalledValidators()
    expect(installedValidatorsAfter).toEqual([addresses.K1Validator])
  })
})
