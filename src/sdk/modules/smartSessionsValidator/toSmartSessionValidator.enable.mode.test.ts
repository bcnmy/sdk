import {
  http,
  type Account,
  type Address,
  type Chain,
  type LocalAccount,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  getAddress
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import { CounterAbi } from "../../../test/__contracts/abi/CounterAbi"
import { testAddresses } from "../../../test/callDatas"
import { toNetwork } from "../../../test/testSetup"
import {
  type NetworkConfig,
  fundAndDeployClients,
  getTestAccount,
  toTestClient
} from "../../../test/testUtils"
import type { Signer } from "../../account"
import { type NexusAccount, toNexusAccount } from "../../account/toNexusAccount"
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
import { generateSalt, parse, stringify } from "./Helpers"
import type { SessionData } from "./Types"
import { smartSessionCreateActions, smartSessionUseActions } from "./decorators"
import { toSmartSessionsValidator } from "./toSmartSessionsValidator"

// @note Temporary skipped for a quick fix
describe.skip("modules.smartSessions.enable.mode.dx", async () => {
  let network: NetworkConfig

  let chain: Chain
  let bundlerUrl: string
  let walletClient: WalletClient

  // Test utils
  let publicClient: PublicClient // testClient not available on public testnets
  let eoaAccount: Account
  let recipientAddress: Address
  let nexusAccountAddress: Address
  let nexusAccount: NexusAccount
  let nexusClient: NexusClient

  let sessionKeyAccount: LocalAccount
  let sessionPublicKey: Address

  let stringifiedSessionDatum: string

  const index = 2n

  beforeAll(async () => {
    network = await toNetwork("BESPOKE_ANVIL_NETWORK_FORKING_BASE_SEPOLIA")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)

    sessionKeyAccount = privateKeyToAccount(generatePrivateKey()) // Generally belongs to the dapp
    sessionPublicKey = getAddress(sessionKeyAccount.address)

    recipientAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth

    const testClient = toTestClient(chain, getTestAccount(5))

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
      index,
      signer: eoaAccount,
      chain,
      transport: http()
    })

    nexusAccountAddress = await nexusAccount.getCounterFactualAddress()

    nexusClient = await createSmartAccountClient({
      index,
      account: nexusAccount,
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    await fundAndDeployClients(testClient, [nexusClient])
  })

  test("full smart sessions enable mode example", async () => {
    const uninitializedSmartSessions = getSmartSessionsValidator({
      useRegistry: false
    })

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
      console.log(installReceipt)
      expect(installReceipt.success).toBe(true)
    }

    const session: Session = {
      sessionValidator: OWNABLE_VALIDATOR_ADDRESS,
      permitERC4337Paymaster: true,
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
      // permitERC4337Paymaster: true
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

    if (!sessionDetails.enableSessionData?.enableSession.permissionEnableSig) {
      throw new Error("enableSessionData is undefined")
    }
    sessionDetails.enableSessionData.enableSession.permissionEnableSig =
      // @ts-ignore
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
      preVerificationGas: 100000000n,
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

    userOperation.signature = encodeSmartSessionSignature(sessionDetails)

    const userOpHash = await nexusClient.sendUserOperation(userOperation)

    const receipt = await nexusClient.waitForUserOperationReceipt({
      hash: userOpHash
    })

    expect(receipt.success).toBe(true)
  })

  test("should allow a user to grant permission using enable mode by default", async () => {
    const sessionsModule = toSmartSessionsValidator({
      account: nexusClient.account,
      signer: eoaAccount as Signer
    })

    const isInstalled = await nexusClient.isModuleInstalled({
      module: sessionsModule.moduleInitData
    })

    if (!isInstalled) {
      const opHash = await nexusClient.installModule({
        module: sessionsModule.moduleInitData
      })
      const installReceipt = await nexusClient.waitForUserOperationReceipt({
        hash: opHash
      })
      expect(installReceipt.success).toBe(true)
    }

    // Extend the Nexus client with smart session creation actions
    const nexusSessionClient = nexusClient.extend(
      smartSessionCreateActions(sessionsModule)
    )

    const moduleData = await nexusSessionClient.grantDeferredPermission({
      sessionRequestedInfo: [
        {
          sessionPublicKey, // Public key of the session
          // sessionValidUntil: number
          // sessionValidAfter: number
          // chainIds: bigint[]
          actionPoliciesInfo: [
            {
              abi: CounterAbi,
              contractAddress: testAddresses.Counter
              // validUntil?: number
              // validAfter?: number
              // valueLimit?: bigint
            }
          ]
        }
      ]
    })

    const sessionData: SessionData = {
      granter: nexusClient.account.address,
      sessionPublicKey,
      description: `Permission to increment a counter for ${testAddresses.Counter}`,
      moduleData
    }

    stringifiedSessionDatum = stringify(sessionData)
  })

  test("should allow the dapp to use the granted session data", async () => {
    const usersSessionData = parse(stringifiedSessionDatum) as SessionData

    // Create a new Nexus client for the session
    // This client will be used to interact with the smart contract account using the session key
    const smartSessionNexusClient = await createSmartAccountClient({
      index,
      accountAddress: usersSessionData.granter,
      signer: eoaAccount as Signer,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    // Create a new smart sessions module with the session key
    const usePermissionsModule = toSmartSessionsValidator({
      account: smartSessionNexusClient.account,
      signer: sessionKeyAccount,
      moduleData: usersSessionData.moduleData
    })

    // Extend the session client with smart session use actions
    const useSmartSessionNexusClient = smartSessionNexusClient.extend(
      smartSessionUseActions(usePermissionsModule)
    )

    const userOpHash = await useSmartSessionNexusClient.usePermission({
      verificationGasLimit: 10000000n,
      callGasLimit: 10000000n,
      preVerificationGas: 100000000n,
      calls: [
        {
          to: testAddresses.Counter,
          data: encodeFunctionData({
            abi: CounterAbi,
            functionName: "incrementNumber"
          })
        },
        {
          to: testAddresses.Counter,
          data: encodeFunctionData({
            abi: CounterAbi,
            functionName: "decrementNumber"
          })
        }
      ]
    })

    expect(userOpHash).toBeDefined()

    const receipt =
      await useSmartSessionNexusClient.waitForUserOperationReceipt({
        hash: userOpHash
      })

    expect(receipt.success).toBe(true)
  })
})
