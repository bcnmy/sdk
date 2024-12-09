import { SmartSessionMode } from "@rhinestone/module-sdk"
import {
  http,
  type Address,
  type Chain,
  type Hex,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  encodeFunctionData
} from "viem"
import { beforeAll, describe, expect, test } from "vitest"
import { playgroundTrue } from "../sdk/account/utils/Utils"
import { createBicoPaymasterClient } from "../sdk/clients/createBicoPaymasterClient"
import {
  type NexusClient,
  createNexusClient
} from "../sdk/clients/createNexusClient"
import type {
  CreateSessionDataParams,
  SessionData
} from "../sdk/modules/smartSessionsValidator/Types"
import {
  smartSessionCreateActions,
  smartSessionUseActions
} from "../sdk/modules/smartSessionsValidator/decorators"
import { toSmartSessionsValidator } from "../sdk/modules/smartSessionsValidator/toSmartSessionsValidator"
import { CounterAbi } from "./__contracts/abi/CounterAbi"
import { testAddresses } from "./callDatas"
import { toNetwork } from "./testSetup"
import {
  type NetworkConfig,
  type TestnetParams,
  getTestParamsForTestnet
} from "./testUtils"

describe.skipIf(!playgroundTrue())("playground", () => {
  let network: NetworkConfig
  // Required for "PUBLIC_TESTNET" networks
  let testParams: TestnetParams
  // Nexus Config
  let chain: Chain
  let bundlerUrl: string
  let walletClient: WalletClient

  // Test utils
  let publicClient: PublicClient // testClient not available on public testnets
  let eoaAccount: PrivateKeyAccount
  let recipientAddress: Address
  let nexusClient: NexusClient
  let nexusAccountAddress: Address

  const index = 6n

  beforeAll(async () => {
    network = await toNetwork("PUBLIC_TESTNET")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
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

    testParams = getTestParamsForTestnet(publicClient)
  })

  test("should init the smart account", async () => {
    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      paymaster: network.paymasterUrl
        ? createBicoPaymasterClient({
            transport: http(network.paymasterUrl)
          })
        : undefined,
      index,
      ...testParams
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

    console.log({ ownerBalance, smartAccountBalance })

    const balancesAreOfCorrectType = [ownerBalance, smartAccountBalance].every(
      (balance) => typeof balance === "bigint"
    )
    if (smartAccountBalance === 0n) {
      const hash = await walletClient.sendTransaction({
        chain,
        account: eoaAccount,
        to: nexusAccountAddress,
        value: 100000000000000000n
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
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
      ]
    })
    const { status } = await publicClient.waitForTransactionReceipt({ hash })
    const balanceAfter = await publicClient.getBalance({
      address: recipientAddress
    })
    expect(status).toBe("success")
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  test("should send a user operation using nexusClient.sendUserOperation", async () => {
    const balanceBefore = await publicClient.getBalance({
      address: recipientAddress
    })
    const userOpHash = await nexusClient.sendUserOperation({
      calls: [{ to: recipientAddress, value: 1n }]
    })
    const { success } = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })
    const balanceAfter = await publicClient.getBalance({
      address: recipientAddress
    })
    expect(success).toBe("true")
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  // Skipped because on base sepolia the attestations for smart sessions have not been created yet
  test.skip("should test creating and using a session", async () => {
    const sessionsModule = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: eoaAccount
    })

    const isInstalledBefore = await nexusClient.isModuleInstalled({
      module: sessionsModule
    })

    if (!isInstalledBefore) {
      const hash = await nexusClient.installModule({
        module: sessionsModule.moduleInitData
      })

      const { success: installSuccess } =
        await nexusClient.waitForUserOperationReceipt({ hash })
      expect(installSuccess).toBe("true")
    }

    const isInstalledAfter = await nexusClient.isModuleInstalled({
      module: sessionsModule
    })
    expect(isInstalledAfter).toBe(true)

    const sessionRequestedInfo: CreateSessionDataParams[] = [
      {
        sessionPublicKey: eoaAccount.address, // session key signer
        actionPoliciesInfo: [
          {
            contractAddress: testAddresses.Counter, // counter address
            functionSelector: "0x273ea3e3" as Hex // function selector for increment count
          }
        ]
      }
    ]

    const nexusSessionClient = nexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    const createSessionsResponse = await nexusSessionClient.grantPermission({
      sessionRequestedInfo
    })

    expect(createSessionsResponse.userOpHash).toBeDefined()
    expect(createSessionsResponse.permissionIds).toBeDefined()

    const receiptTwo = await nexusClient.waitForUserOperationReceipt({
      hash: createSessionsResponse.userOpHash
    })

    expect(receiptTwo.success).toBe("true")

    const sessionData: SessionData = {
      granter: nexusClient.account.address,
      sessionPublicKey: eoaAccount.address,
      moduleData: {
        ...createSessionsResponse,
        mode: SmartSessionMode.USE
      }
    }

    const smartSessionNexusClient = await createNexusClient({
      chain,
      accountAddress: nexusClient.account.address,
      signer: eoaAccount,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      index,
      ...testParams
    })

    const usePermissionsModule = toSmartSessionsValidator({
      account: smartSessionNexusClient.account,
      signer: eoaAccount,
      moduleData: sessionData.moduleData
    })

    const useSmartSessionNexusClient = smartSessionNexusClient.extend(
      smartSessionUseActions(usePermissionsModule)
    )

    const userOpHash = await useSmartSessionNexusClient.usePermission({
      calls: [
        {
          to: testAddresses.Counter,
          data: encodeFunctionData({
            abi: CounterAbi,
            functionName: "incrementNumber",
            args: []
          })
        }
      ]
    })

    expect(userOpHash).toBeDefined()
    const receiptThree =
      await useSmartSessionNexusClient.waitForUserOperationReceipt({
        hash: userOpHash
      })
  })
})
