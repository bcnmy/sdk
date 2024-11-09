import { computeAddress } from "@silencelaboratories/walletprovider-sdk"
import {
  http,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  isHex,
  verifyMessage
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { danActions } from "."
import { toNetwork } from "../../../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp
} from "../../../../../test/testUtils"
import { type NexusClient, createNexusClient } from "../../../createNexusClient"
import { DanWallet, hexToUint8Array, uuid } from "../Helpers"

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

  test("should check signature verification using keyGen and sigGen", async () => {
    const danNexusClient = nexusClient.extend(danActions())

    const keyGenData = await danNexusClient.keyGen()
    const sigGenData = await danNexusClient.sigGen({
      keyGenData,
      calls: [{ to: userTwo.address, value: 1n }]
    })

    const userOperation = {
      ...sigGenData.userOperation,
      signature: sigGenData.signature
    }

    const userOpHash =
      // @ts-ignore
      await danNexusClient.account?.getUserOpHash(userOperation)

    if (!userOpHash) {
      throw new Error("userOpHash is undefined")
    }

    const ethAddress = computeAddress(keyGenData.publicKey)

    const valid = await verifyMessage({
      address: ethAddress,
      message: { raw: userOpHash },
      signature: sigGenData.signature
    })

    expect(valid).toBe(true)
  })

  test("should send a tx with dan", async () => {
    const danNexusClient = nexusClient.extend(danActions())

    const keyGenData = await danNexusClient.keyGen()
    const hash = await danNexusClient.sendTx({
      keyGenData,
      calls: [{ to: userTwo.address, value: 1n }]
    })

    const { status } = await testClient.waitForTransactionReceipt({ hash })

    expect(status).toBe("success")
  })
})
