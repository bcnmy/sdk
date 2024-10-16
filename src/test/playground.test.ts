import {
  http,
  type Address,
  type Chain,
  type Client,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient
} from "viem"
import type { Account } from "viem"
import type { Transport } from "viem"
import type { UserOperationReceipt } from "viem/account-abstraction"
import { beforeAll, describe, expect, test } from "vitest"
import { type NexusAccount, toNexusAccount } from "../sdk"
import { playgroundTrue } from "../sdk/account/utils/Utils"
import { createBicoPaymasterClient } from "../sdk/clients/createBicoPaymasterClient"
import {
  type NexusClient,
  createNexusClient
} from "../sdk/clients/createNexusClient"
import { toNetwork } from "./testSetup"
import type { NetworkConfig } from "./testUtils"

// Remove the following lines to use the default factory and validator addresses
// These are relevant only for now on base sopelia chain and are likely to change
const k1ValidatorAddress = "0x000000017D8e9Eb74CEcb09a3532f8E18E883521"
const factoryAddress = "0x00000001cdE7c53f30b20Bd36015C48652F3faaC"

describe.skipIf(!playgroundTrue)("playground", () => {
  let network: NetworkConfig
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let paymasterUrl: undefined | string
  let walletClient: WalletClient

  // Test utils
  let publicClient: PublicClient // testClient not available on public testnets
  let eoaAccount: PrivateKeyAccount
  let recipientAddress: Address
  let nexusClient: NexusClient
  let nexusAccountAddress: Address
  let nexusAccount: NexusAccount

  beforeAll(async () => {
    network = await toNetwork("PUBLIC_TESTNET")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    paymasterUrl = network.paymasterUrl
    eoaAccount = network.account as PrivateKeyAccount

    recipientAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth

    walletClient = createWalletClient({
      account: eoaAccount,
      chain,
      transport: http()
    })

    publicClient = createPublicClient({
      chain,
      transport: http()
    })

    nexusAccount = await toNexusAccount({
      client: walletClient as Client<Transport, Chain, Account>,
      k1ValidatorAddress,
      factoryAddress
    })
  })

  test("should have factory and k1Validator deployed", async () => {
    const byteCodes = await Promise.all([
      publicClient.getCode({
        address: k1ValidatorAddress
      }),
      publicClient.getCode({
        address: factoryAddress
      })
    ])

    expect(byteCodes.every(Boolean)).toBeTruthy()
  })

  test("should init the smart account", async () => {
    nexusClient = await createNexusClient({
      account: nexusAccount,
      bundlerTransport: http(bundlerUrl)
    })
  })

  test("should log relevant addresses", async () => {
    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    console.log({ nexusAccountAddress })
  })

  test("should check balances and top up relevant addresses", async () => {
    const [ownerBalance, smartAccountBalance] = await Promise.all([
      publicClient.getBalance({
        address: eoaAccount.address
      }),
      publicClient.getBalance({
        address: nexusAccountAddress
      })
    ])

    const balancesAreOfCorrectType = [ownerBalance, smartAccountBalance].every(
      (balance) => typeof balance === "bigint"
    )
    if (smartAccountBalance === 0n) {
      const hash = await walletClient.sendTransaction({
        chain,
        account: eoaAccount,
        to: nexusAccountAddress,
        value: 1000000000000000000n
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log({ receipt })
    }
    expect(balancesAreOfCorrectType).toBeTruthy()
  })

  test("should send some native token", async () => {
    const balanceBefore = await publicClient.getBalance({
      address: recipientAddress
    })
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        }
      ],
      preVerificationGas: 800000000n
    })
    const { status } = await publicClient.waitForTransactionReceipt({ hash })
    const balanceAfter = await publicClient.getBalance({
      address: recipientAddress
    })
    expect(status).toBe("success")
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  test("should send some native token using the paymaster", async () => {
    if (!paymasterUrl) {
      console.log("No paymaster url provided")
      return
    }

    nexusClient = await createNexusClient({
      account: nexusAccount,
      bundlerTransport: http(bundlerUrl),
      k1ValidatorAddress,
      factoryAddress,
      paymaster: createBicoPaymasterClient({
        paymasterUrl
      })
    })
    expect(async () =>
      nexusClient.sendTransaction({
        calls: [
          {
            to: eoaAccount.address,
            value: 1n
          }
        ]
      })
    ).rejects.toThrow()
  })

  test("should send sequential user ops", async () => {
    const start = performance.now()
    const nexusClient = await createNexusClient({
      account: nexusAccount,
      bundlerTransport: http(bundlerUrl),
      k1ValidatorAddress,
      factoryAddress
    })
    const receipts: UserOperationReceipt[] = []
    for (let i = 0; i < 3; i++) {
      const hash = await nexusClient.sendUserOperation({
        calls: [
          {
            to: recipientAddress,
            value: 0n
          }
        ]
      })
      const receipt = await nexusClient.waitForUserOperationReceipt({ hash })
      receipts.push(receipt)
    }
    expect(receipts.every((receipt) => receipt.success)).toBeTruthy()
    const end = performance.now()
    console.log(`Time taken: ${end - start} milliseconds`)
  })

  test("should send parallel user ops", async () => {
    const start = performance.now()
    const nexusClient = await createNexusClient({
      account: nexusAccount,
      bundlerTransport: http(bundlerUrl),
      k1ValidatorAddress,
      factoryAddress
    })
    const userOpPromises: Promise<`0x${string}`>[] = []
    for (let i = 0; i < 3; i++) {
      userOpPromises.push(
        nexusClient.sendUserOperation({
          calls: [
            {
              to: recipientAddress,
              value: 0n
            }
          ]
        })
      )
    }
    const hashes = await Promise.all(userOpPromises)
    expect(hashes.length).toBe(3)
    const receipts = await Promise.all(
      hashes.map((hash) => nexusClient.waitForUserOperationReceipt({ hash }))
    )
    expect(receipts.every((receipt) => receipt.success)).toBeTruthy()
    const end = performance.now()
    console.log(`Time taken: ${end - start} milliseconds`)
  })
})
