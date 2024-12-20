import { getAccount } from "@rhinestone/module-sdk/account"
import {
  OWNABLE_VALIDATOR_ADDRESS,
  type Session,
  SmartSessionMode,
  decodeSmartSessionSignature,
  encodeSmartSessionSignature,
  encodeValidationData,
  getEnableSessionDetails,
  getOwnableValidatorMockSignature,
  getSmartSessionsValidator,
  getSudoPolicy
} from "@rhinestone/module-sdk/module"
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
  SIMPLE_SESSION_VALIDATOR_ADDRESS,
  SMART_SESSIONS_ADDRESS
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
      signer: eoaAccount,
      chain,
      transport: http(),
      ...testParams
    })

    nexusAccountAddress = await nexusAccount.getCounterFactualAddress()

    nexusClient = await createSmartAccountClient({
      account: nexusAccount,
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      ...testParams
    })
  })

  test("should pack user operation", async () => {
    const packed = toPackedUserOperation({
      signature:
        "0x02010000e014010040e0141d020004e02004e033000080e0163ce0165f010420e0163f0001e0141f1f014a345c1919b8c57af968a155f2554b43897682979db7c0f499c1c28b438546020aa184e0033f132483da3a338895199e5e538530213157e931bf06e0031fe00a001fc0920a0f5a416164e457eaa8a6d6274c1290214351cbbf8d0b39475a89f19cc40003e00a33e00200010160e0020ce00a000001e1163f0002e00a33e00400e0163fe1163fe2181fe0053f13548435df309866a3880fc4ce84298019691bb1372023e03300e2169f0000e1163fe03800e2155f06000020273ea3e32007e01c001314e4829e655f0b3a1793838ddd47273d5341d416e01638e017dfe0189fe0035f13529ad04f4d83aab25144a90267d4a1443b84f5a6e0031fe00a00e1177fe01700005520201f2d6db27c52e3c11c1cf24072004ac75cba55e47aabf13d40b29fa092d038572f1fe089db55aea6df9d9abe02e6c38d97de397afd949eb1dcf4526280d6855333d41166ec237cd5ff66c5831847c416b22367fb1b2054e01e001f418b49b48ae9d1d856d927e00a1d759c9e003b06c75f5058631a6aee4a3db74f1f9675cb003a60b1eba3502cdd8401f184cb4e215e7a2c4ee30e628fa05536d65f01551ce01168040000000000",
      sender: "0x9d853Bb2cF20B803f7B0F4535EF46a35685802e9",
      maxFeePerGas: 1500717n,
      maxPriorityFeePerGas: 1500000n,
      callData:
        "0xe9ae5c5300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000003814e4829e655f0b3a1793838ddd47273d5341d4160000000000000000000000000000000000000000000000000000000000000000273ea3e30000000000000000",
      factory: undefined,
      factoryData: undefined,
      nonce:
        13699614532694608868838846670020553880181607859668085174656940422496488783872n,
      callGasLimit: 562217n,
      preVerificationGas: 221775n,
      verificationGasLimit: 67305n,
      paymasterPostOpGasLimit: 67305n,
      paymasterVerificationGasLimit: 67305n
    })

    console.log(JSON.stringify(deepHexlify(packed), null, 2))
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

  test.skip("should support smart sessions use mode", async () => {
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

    const sessionDetailKeys = Object.keys(sessionDetails)
    console.log({ sessionDetailKeys })

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

    console.log(1, { calls })

    sessionDetails.signature = getOwnableValidatorMockSignature({
      threshold: 1
    })

    console.log(2, { sessionDetails })

    const userOperation = await nexusClient.prepareUserOperation({
      calls,
      signature: encodeSmartSessionSignature(sessionDetails)
    })

    const userOpHashToSign = nexusClient.account.getUserOpHash(userOperation)

    sessionDetails.signature = await sessionKeyAccount.signMessage({
      message: { raw: userOpHashToSign }
    })

    console.log(3, { sessionDetails })

    userOperation.signature = encodeSmartSessionSignature(sessionDetails)
    userOperation.nonce = await nexusClient.account.getNonce({
      // @ts-ignore
      moduleAddress: SMART_SESSIONS_ADDRESS,
      key: BigInt(Date.now()),
      validationMode: "0x00"
    })

    console.log(4, { userOperation })

    const userOpHash = await nexusClient.sendUserOperation(userOperation)

    console.log(5, { userOpHash })
    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })

    console.log({ receipt })
  })
})
