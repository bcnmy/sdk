import {
  OWNABLE_VALIDATOR_ADDRESS,
  type Session,
  SmartSessionMode,
  encodeSmartSessionSignature,
  encodeValidationData,
  getAccount,
  getEnableSessionDetails,
  getOwnableValidatorMockSignature,
  getSmartSessionsValidator,
  getSudoPolicy
} from "@rhinestone/module-sdk"
import {
  http,
  type Abi,
  type AbiFunction,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  type PublicClient,
  encodeFunctionData,
  getContract,
  slice,
  toFunctionSelector
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../test/__contracts/abi/CounterAbi"
import { MockCalleeAbi } from "../../../test/__contracts/abi/MockCalleeAbi"
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
  createSmartAccountClient
} from "../../clients/createSmartAccountClient"
import { SMART_SESSIONS_ADDRESS } from "../../constants"
import type { Module } from "../utils/Types"
import { generateSalt } from "./Helpers"
import { toSmartSessionsValidator } from "./toSmartSessionsValidator"

describe.skip("modules.smartSessions.enable.mode.local.dx", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let nexusClient: NexusClient
  let nexusAccountAddress: Address
  let sessionKeyAccount: LocalAccount
  let sessionPublicKey: Address
  let cachedSessionData: string

  let sessionsModule: Module

  beforeAll(async () => {
    network = await toNetwork("BESPOKE_ANVIL_NETWORK_FORKING_BASE_SEPOLIA")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    sessionKeyAccount = privateKeyToAccount(generatePrivateKey()) // Generally belongs to the dapp
    sessionPublicKey = sessionKeyAccount.address

    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createSmartAccountClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()

    sessionsModule = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: eoaAccount
    })

    await fundAndDeployClients(testClient, [nexusClient])
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should check smart sessions enable mode on anvil network", async () => {
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
      expect(installReceipt.success).toBe(true)
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

    const sessionDetailsWitPermissionEnableHash = await getEnableSessionDetails(
      {
        enableMode: SmartSessionMode.UNSAFE_ENABLE,
        sessions: [session],
        account: nexusAccount,
        clients: [testClient as any]
        // enableValidatorAddress: MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS
      }
    )

    const { permissionEnableHash, ...sessionDetails } =
      sessionDetailsWitPermissionEnableHash

    const sessionDetailKeys = Object.keys(sessionDetails)
    console.log({ sessionDetailKeys })

    sessionDetails.enableSessionData.enableSession.permissionEnableSig =
      await eoaAccount.signMessage({
        message: {
          raw: permissionEnableHash
        }
      })

    // sessionDetails.enableSessionData.enableSession.permissionEnableSig =
    //   encodePacked(
    //     ["address", "bytes"],
    //     [MAINNET_ADDRESS_K1_VALIDATOR_ADDRESS, permissionEnableRawSig]
    //   )

    const nonce = await nexusClient.account.getNonce({
      // @ts-ignore
      moduleAddress: SMART_SESSIONS_ADDRESS
    })

    console.log({ nonce })

    // const signature = encodeSmartSessionSignature(sessionDetails)

    // const decodededSignature = decodeSmartSessionSignature({
    //   signature,
    //   account: nexusAccount
    // })

    // expect(decodededSignature.mode).toBe(SmartSessionMode.UNSAFE_ENABLE)
    // expect(decodededSignature.permissionId).toBe(sessionDetails.permissionId)
    // expect(decodededSignature.signature).toBe(sessionDetails.signature)

    // console.log({ decodededSignature })

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

    console.log({ calls })

    sessionDetails.signature = getOwnableValidatorMockSignature({
      threshold: 1
    })

    const userOperation = await nexusClient.prepareUserOperation({
      calls,
      nonce,
      signature: encodeSmartSessionSignature(sessionDetails)
    })

    const userOpHashToSign = nexusClient.account.getUserOpHash(userOperation)

    sessionDetails.signature = await sessionKeyAccount.signMessage({
      message: { raw: userOpHashToSign }
    })

    userOperation.signature = encodeSmartSessionSignature(sessionDetails)

    console.log({ userOperation })
    console.log("It fails at this point...")

    const userOpHash = await nexusClient.sendUserOperation(userOperation)

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })

    console.log({ receipt })
  })
})
