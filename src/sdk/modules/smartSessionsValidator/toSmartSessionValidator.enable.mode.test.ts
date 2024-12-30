import {
  http,
  type Address,
  type Chain,
  type LocalAccount,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  encodePacked,
  getAddress
} from "viem"
import {
  entryPoint07Address,
  getUserOperationHash,
  toPackedUserOperation
} from "viem/account-abstraction"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../test/__contracts/abi/CounterAbi"
import { testAddresses } from "../../../test/callDatas"
import { toNetwork } from "../../../test/testSetup"
import { getTestParamsForTestnet } from "../../../test/testUtils"
import type { NetworkConfig, TestnetParams } from "../../../test/testUtils"
import { type NexusAccount, toNexusAccount } from "../../account/toNexusAccount"
import { deepHexlify } from "../../account/utils/deepHexlify"
import {
  type NexusClient,
  createSmartAccountClient
} from "../../clients/createSmartAccountClient"
import {
  MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS,
  OWNABLE_VALIDATOR_ADDRESS,
  SMART_SESSIONS_ADDRESS,
  type Session,
  SmartSessionMode,
  encodeSmartSessionSignature,
  encodeValidationData,
  getAccount,
  getEnableSessionDetails,
  getOwnableValidatorMockSignature,
  getSmartSessionsValidator,
  getSudoPolicy
} from "../../constants"
import { generateSalt } from "./Helpers"

describe("modules.smartSessions.enable.mode.dx", async () => {
  let network: NetworkConfig
  // Required for "TESTNET_FROM_ENV_VARS" networks
  let testParams: TestnetParams

  let chain: Chain
  let bundlerUrl: string
  let paymasterUrl: undefined | string
  let walletClient: WalletClient

  // Test utils
  let publicClient: PublicClient // testClient not available on public testnets
  let eoaAccount: PrivateKeyAccount
  let recipientAddress: Address
  let nexusAccountAddress: Address
  let nexusAccount: NexusAccount
  let nexusClient: NexusClient

  let sessionKeyAccount: LocalAccount
  let sessionPublicKey: Address

  beforeAll(async () => {
    network = await toNetwork("TESTNET_FROM_ENV_VARS")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    paymasterUrl = network.paymasterUrl
    eoaAccount = network.account as PrivateKeyAccount

    sessionKeyAccount = privateKeyToAccount(generatePrivateKey()) // Generally belongs to the dapp
    sessionPublicKey = getAddress(sessionKeyAccount.address)

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

    nexusAccount = await toNexusAccount({
      index: 1n,
      signer: eoaAccount,
      chain,
      transport: http(),
      ...testParams
    })

    nexusAccountAddress = await nexusAccount.getCounterFactualAddress()

    nexusClient = await createSmartAccountClient({
      index: 1n,
      account: nexusAccount,
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      ...testParams
    })
  })

  test.skip("should send a sponsored transaction", async () => {
    // Get initial balance
    const initialBalance = await publicClient.getBalance({
      address: nexusAccountAddress
    })

    if (initialBalance === 0n) {
      console.log("Fund account", nexusAccountAddress)
    }

    // Send user operation
    const hash = await nexusClient.sendTransaction({
      calls: [
        {
          to: recipientAddress,
          value: 1n
        }
      ]
    })

    // Wait for the transaction to be mined
    const { status } = await publicClient.waitForTransactionReceipt({ hash })
    expect(status).toBe("success")
    // Get final balance
    const finalBalance = await publicClient.getBalance({
      address: nexusAccountAddress
    })

    // Check that the balance hasn't changed
    // No gas fees were paid, so the balance should have decreased only by 1n
    expect(finalBalance).toBeLessThan(initialBalance)
  })

  test("should support smart sessions enable mode", async () => {
    const uninitializedSmartSessions = getSmartSessionsValidator({})

    const isInstalled = await nexusClient.isModuleInstalled({
      module: uninitializedSmartSessions
    })

    if (!isInstalled) {
      const opHash = await nexusClient.installModule({
        module: uninitializedSmartSessions
      })
      const installReceipt = await nexusClient.waitForUserOperationReceipt({
        hash: opHash
      })
      expect(installReceipt.success).toBe("true")
    }

    const session: Session = {
      sessionValidator: OWNABLE_VALIDATOR_ADDRESS,
      sessionValidatorInitData: encodeValidationData({
        threshold: 1,
        owners: [sessionPublicKey]
      }),
      salt: generateSalt(),
      userOpPolicies: [],
      erc7739Policies: {
        allowedERC7739Content: [],
        erc1271Policies: []
      },
      actions: [
        {
          actionTarget: testAddresses.Counter,
          actionTargetSelector: "0x273ea3e3", // incrementNumber
          actionPolicies: [getSudoPolicy()]
        }
      ],
      chainId: BigInt(chain.id)
    }

    const nexusAccount = getAccount({
      address: nexusClient.account.address,
      type: "nexus"
    })

    const sessionDetailsWithPermissionEnableHash =
      await getEnableSessionDetails({
        enableMode: SmartSessionMode.UNSAFE_ENABLE,
        sessions: [session],
        account: nexusAccount,
        clients: [publicClient],
        enableValidatorAddress: MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS
      })

    const { permissionEnableHash, ...sessionDetails } =
      sessionDetailsWithPermissionEnableHash

    sessionDetails.enableSessionData.enableSession.permissionEnableSig =
      await eoaAccount.signMessage({
        message: {
          raw: permissionEnableHash
        }
      })
    const calls = [
      {
        to: session.actions[0].actionTarget,
        data: session.actions[0].actionTargetSelector
      }
    ]

    expect(session.actions[0].actionTargetSelector).toBe(
      encodeFunctionData({
        abi: CounterAbi,
        functionName: "incrementNumber"
      })
    )

    // Here we are setting the signature to the mock signature
    sessionDetails.signature = getOwnableValidatorMockSignature({
      threshold: 1
    })

    const userOperation = await nexusClient.prepareUserOperation({
      verificationGasLimit: 10000000n,
      callGasLimit: 10000000n,
      preVerificationGas: 10000000n,
      calls,
      signature: encodeSmartSessionSignature(sessionDetails),
      nonce: await nexusClient.account.getNonce({
        // @ts-ignore
        moduleAddress: SMART_SESSIONS_ADDRESS
      })
    })

    const userOpHashToSign = nexusClient.account.getUserOpHash(userOperation)

    sessionDetails.signature = await sessionKeyAccount.signMessage({
      message: { raw: userOpHashToSign }
    })

    console.log(3, { sessionDetails })

    userOperation.signature = encodeSmartSessionSignature(sessionDetails)

    const userOpHash = await nexusClient.sendUserOperation(userOperation)

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })

    console.log({ receipt })

    expect(receipt.success).toBe("true")
  })
})
