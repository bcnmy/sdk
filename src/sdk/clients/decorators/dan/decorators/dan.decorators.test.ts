import { http, type Address, type Chain, type LocalAccount, isHex } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { danActions } from "."
import { toNetwork } from "../../../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  getBalance,
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp
} from "../../../../../test/testUtils"
import { type NexusClient, createNexusClient } from "../../../createNexusClient"
import { DanWallet, hexToUint8Array, uuid } from "../Helpers"

describe("modules.dan.decorators", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let nexusAccountAddress: Address
  let nexusClient: NexusClient
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

    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await topUp(testClient, nexusAccountAddress)
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test.concurrent("DanWallet should initialize correctly", () => {
    const account = getTestAccount(0)
    const danWallet = new DanWallet(account, chain)
    expect(danWallet.walletClient).toBeDefined()
    expect(danWallet.walletClient.account).toBe(account)
    expect(danWallet.walletClient.chain).toBe(chain)
  })

  test.concurrent("DanWallet should sign typed data", async () => {
    const account = getTestAccount(0)
    const danWallet = new DanWallet(account, chain)

    const typedData = {
      types: {
        Test: [{ name: "test", type: "string" }]
      },
      primaryType: "Test",
      domain: {
        name: "Test Domain",
        version: "1",
        chainId: 1
      },
      message: {
        test: "Hello World"
      }
    }

    const signature = await danWallet.signTypedData("", typedData)
    expect(signature).toBeDefined()
    expect(isHex(signature as string)).toBe(true)
  })

  test.concurrent("hexToUint8Array should convert hex string correctly", () => {
    const hex = "0a0b0c"
    const result = hexToUint8Array(hex)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(3)
    expect(Array.from(result)).toEqual([10, 11, 12])
  })

  test.concurrent("hexToUint8Array should throw on invalid hex string", () => {
    expect(() => hexToUint8Array("0a0")).toThrow(
      "Hex string must have an even number of characters"
    )
  })

  test.concurrent("uuid should generate string of correct length", () => {
    const length = 32
    const result = uuid(length)
    expect(result.length).toBe(length)
    expect(typeof result).toBe("string")
  })

  test.concurrent("uuid should use default length of 24", () => {
    const result = uuid()
    expect(result.length).toBe(24)
  })

  test.concurrent("uuid should generate unique values", () => {
    const uuid1 = uuid()
    const uuid2 = uuid()
    expect(uuid1).not.toBe(uuid2)
  })

  test("should send some native token", async () => {
    const balanceBefore = await testClient.getBalance({
      address: userThree.address
    })
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: userThree.address,
          value: 1n
        }
      ]
    })
    const { status } = await testClient.waitForTransactionReceipt({ hash })
    const balanceAfter = await testClient.getBalance({
      address: userThree.address
    })
    expect(status).toBe("success")
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  test("should test dan decorators", async () => {
    const balanceOfRecipient = await getBalance(testClient, userTwo.address)

    const danNexusClient = nexusClient.extend(danActions())
    const keyGenData = await danNexusClient.keyGen()

    const hash = await danNexusClient.sendTx({
      keyGenData,
      calls: [{ to: userTwo.address, value: 1n }]
    })

    const balanceOfRecipientAfter = await getBalance(
      testClient,
      userTwo.address
    )

    const { status } = await testClient.waitForTransactionReceipt({ hash })

    expect(balanceOfRecipientAfter - balanceOfRecipient).toBe(1n)
    expect(status).toBe("success")
  })
})
