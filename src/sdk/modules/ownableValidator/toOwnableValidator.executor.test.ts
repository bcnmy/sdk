import {
  getAddOwnableExecutorOwnerAction,
  getExecuteOnOwnedAccountAction
} from "@rhinestone/module-sdk"
import {
  http,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type WalletClient,
  encodePacked,
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
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import { moduleActivator } from "../../clients/decorators/erc7579/moduleActivator"
import { toK1Validator } from "../k1Validator/toK1Validator"
import type { Module } from "../utils/Types"

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

    nexusClient.extend(moduleActivator(k1Module))
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
