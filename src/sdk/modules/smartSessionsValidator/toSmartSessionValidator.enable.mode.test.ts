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
import { DUMMY_ECDSA_SIG } from "./toSmartSessionsValidator"

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

    console.log(
      { nexusAccountAddress, sessionPublicKey },
      { eoaAccountAddress: eoaAccount.address }
    )

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

  test("should pack user operation", async () => {
    const packed = toPackedUserOperation({
      signature:
        "0x02010000e014010040e0141d020004802004e03300e0173f00e0e0155c0103c0e0151f0100012003e011001f014a34ae11a739a10c39be924306d512bff8c480de193a42f1209c99d1b2950c02e20f42e0033c1341f143f4b5f19afcd2602f6ade18e75e9b5e37d3e0031fe00a001fc06d47491264728e9233d06d2b0efbc5689de47b89e9fe3d419365676ef3d77d001de00a33e00200e015be201f00202004e012000101a0e0121c400014147a478affccf9ba4722b4fd42fb68e460d16fbc1e4018e03e00e2163f0100602003e05300e117400420273ea3e3e01f801314e4829e655f0b3a1793838ddd47273d5341d416e0163be017dfe0189fe0035f13529ad04f4d83aab25144a90267d4a1443b84f5a6e0031fe00a00e1177fe01700005520201f2d6db27c52e3c11c1cf24072004ac75cba04086e15e6bd4485230c7655d5d1e01f1bef115c8098335703bda6e3f8f565bd2c00485124334422c5798da167e63a5d1179826812046dd500cf2a1a7439b0c83d6d1c2054e01e001f414c83cd664b8fcb40e8e06152028f452d11e9ed58e80de3825645d3f53b16c31f4b7e84ab430dc42200d802a42e85b98eb1d5e319e32ceb4ee3b349e285025bdc01661be01168040000000000",
      callData:
        "0xe9ae5c5300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000003814e4829e655f0b3a1793838ddd47273d5341d4160000000000000000000000000000000000000000000000000000000000000000273ea3e30000000000000000",
      sender: "0xdC66A533f27aC804B40c991F6016ceAAb8d7Defc",
      maxFeePerGas: 3500855n,
      maxPriorityFeePerGas: 3500000n,
      factory: undefined,
      factoryData: undefined,
      nonce:
        84423803952951738471617358635217431751803879867990993447121768113268552892416n,
      callGasLimit: 1562217n,
      verificationGasLimit: 1567305n,
      paymasterPostOpGasLimit: 1567305n,
      paymasterVerificationGasLimit: 1567305n,
      preVerificationGas: 10000000000n
    })

    // console.log(JSON.stringify(deepHexlify(packed), null, 2))
    expect(packed.nonce).toBe(
      84423803952951738471617358635217431751803879867990993447121768113268552892416n
    )

    console.log(JSON.stringify(deepHexlify(packed), null, 2))
  })

  test("should send a sponsored transaction", async () => {
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
      sessionValidator: SIMPLE_SESSION_VALIDATOR_ADDRESS,
      sessionValidatorInitData: sessionPublicKey,
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

    // Here we are setting the signature to the mock signature

    // sessionDetails.signature = getOwnableValidatorMockSignature({
    //   threshold: 1
    // })
    sessionDetails.signature = "0x"

    console.log(2, { sessionDetails })

    const userOperation = await nexusClient.prepareUserOperation({
      verificationGasLimit: 10000000n,
      paymasterVerificationGasLimit: 10000000n,
      callGasLimit: 10000000n,
      paymasterPostOpGasLimit: 10000000n,
      preVerificationGas: 10000000n,
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

    const userOpHash = await nexusClient.sendDebugUserOperation(userOperation)

    console.log(5, { userOpHash })
    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })

    console.log({ receipt })
  })
})
