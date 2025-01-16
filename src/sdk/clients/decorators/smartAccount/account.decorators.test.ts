import { http, type Account, type Address, type Chain, isHex } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../../test/__contracts/abi"
import { mockAddresses } from "../../../../test/__contracts/mockAddresses"
import { toNetwork } from "../../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  fundAndDeployClients,
  getBalance,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../../test/testUtils"
import {
  TEST_ADDRESS_K1_VALIDATOR_ADDRESS,
  TEST_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
} from "../../../constants"
import {
  type NexusClient,
  createSmartAccountClient
} from "../../createSmartAccountClient"

describe("account.decorators", async () => {
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

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    recipient = getTestAccount(1)
    recipientAddress = recipient.address
    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createSmartAccountClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      validatorAddress: TEST_ADDRESS_K1_VALIDATOR_ADDRESS,
      factoryAddress: TEST_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS,
      useTestBundler: true
    })
    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await fundAndDeployClients(testClient, [nexusClient])
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test.concurrent("should sign a message", async () => {
    const signedMessage = await nexusClient.signMessage({ message: "hello" })

    expect(isHex(signedMessage)).toBe(true)
  })

  test.concurrent("should currently fail to sign with typed data", async () => {
    expect(
      nexusClient.signTypedData({
        domain: {
          name: "Ether Mail",
          version: "1",
          chainId: 1,
          verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
        },
        types: {
          Person: [
            { name: "name", type: "string" },
            { name: "wallet", type: "address" }
          ],
          Mail: [
            { name: "from", type: "Person" },
            { name: "to", type: "Person" },
            { name: "contents", type: "string" }
          ]
        },
        primaryType: "Mail",
        message: {
          from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
          },
          to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
          },
          contents: "Hello, Bob!"
        }
      })
    ).rejects.toThrow()
  })

  test("should send a user operation using sendTransaction", async () => {
    const balanceBefore = await getBalance(testClient, recipientAddress)
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        }
      ]
    })
    const { status } = await nexusClient.waitForTransactionReceipt({ hash })
    const balanceAfter = await getBalance(testClient, recipientAddress)
    expect(status).toBe("success")
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  test("should write to a contract", async () => {
    const counterValueBefore = await testClient.readContract({
      abi: CounterAbi,
      functionName: "getNumber",
      address: mockAddresses.Counter
    })

    expect(counterValueBefore).toBe(0n)
    const hash = await nexusClient.writeContract({
      abi: CounterAbi,
      functionName: "incrementNumber",
      address: mockAddresses.Counter,
      chain
    })
    const { status } = await nexusClient.waitForTransactionReceipt({ hash })
    const counterValueAfter = await testClient.readContract({
      abi: CounterAbi,
      functionName: "getNumber",
      address: mockAddresses.Counter
    })

    expect(status).toBe("success")
    expect(counterValueAfter).toBe(1n)
  })
})
