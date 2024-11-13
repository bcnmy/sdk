import { http, type Address, type Chain, type LocalAccount, isHex } from "viem"
import { verifyMessage } from "viem"
import type { UserOperation } from "viem/account-abstraction"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../../../test/testUtils"
import { type NexusClient, createNexusClient } from "../../../createNexusClient"
import { DanWallet, hexToUint8Array, uuid } from "../Helpers"
import { danActions } from "./"

describe("dan.decorators", async () => {
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
    await fundAndDeployClients(testClient, [nexusClient])
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("DanWallet should initialize correctly", () => {
    const account = getTestAccount(0)
    const danWallet = new DanWallet(account, chain)
    expect(danWallet.walletClient).toBeDefined()
    expect(danWallet.walletClient.account).toBe(account)
    expect(danWallet.walletClient.chain).toBe(chain)
  })

  test("DanWallet should sign typed data", async () => {
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

  test("hexToUint8Array should convert hex string correctly", () => {
    const hex = "0a0b0c"
    const result = hexToUint8Array(hex)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(3)
    expect(Array.from(result)).toEqual([10, 11, 12])
  })

  test("hexToUint8Array should throw on invalid hex string", () => {
    expect(() => hexToUint8Array("0a0")).toThrow(
      "Hex string must have an even number of characters"
    )
  })

  test("uuid should generate string of correct length", () => {
    const length = 32
    const result = uuid(length)
    expect(result.length).toBe(length)
    expect(typeof result).toBe("string")
  })

  test("uuid should use default length of 24", () => {
    const result = uuid()
    expect(result.length).toBe(24)
  })

  test("uuid should generate unique values", () => {
    const uuid1 = uuid()
    const uuid2 = uuid()
    expect(uuid1).not.toBe(uuid2)
  })

  test("should check that signature is verified", async () => {
    const danNexusClient = nexusClient.extend(danActions())
    const keyGenData = await danNexusClient.keyGen()

    // @ts-ignore
    const preparedUserOperation = (await danNexusClient.prepareUserOperation({
      calls: [{ to: userTwo.address, value: 1n }]
    })) as UserOperation

    const sendUserOperationParameters = await danNexusClient.sigGen({
      keyGenData,
      ...preparedUserOperation
    })

    const userOpHash = await danNexusClient?.account?.getUserOpHash(
      preparedUserOperation
    )

    if (!userOpHash || !sendUserOperationParameters.signature)
      throw new Error("Missing userOpHash or signature")

    const valid = await verifyMessage({
      address: keyGenData.sessionPublicKey,
      message: { raw: userOpHash },
      signature: sendUserOperationParameters.signature
    })

    // Verify transaction success
    expect(valid).toBe(true)
  })
})
