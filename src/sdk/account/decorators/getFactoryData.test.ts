import {
  http,
  type Address,
  type Chain,
  type LocalAccount,
  type PublicClient,
  type WalletClient,
  createWalletClient
} from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import {
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../../test/testUtils"
import {
  type NexusClient,
  createSmartAccountClient
} from "../../clients/createSmartAccountClient"
import {
  MEE_VALIDATOR_ADDRESS,
  RHINESTONE_ATTESTER_ADDRESS,
  TEST_ADDRESS_K1_VALIDATOR_ADDRESS,
  TEST_ADDRESS_K1_VALIDATOR_FACTORY_ADDRESS
} from "../../constants"
import type { NexusAccount } from "../toNexusAccount"
import { getK1FactoryData, getMeeFactoryData } from "./getFactoryData"

describe("nexus.account.getFactoryData", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let nexusAccount: NexusAccount
  let walletClient: WalletClient

  beforeAll(async () => {
    network = await toNetwork("MAINNET_FROM_ENV_VARS")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = network.account!
    testClient = toTestClient(chain, getTestAccount(5))
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should check factory data", async () => {
    const factoryData = await getK1FactoryData({
      signerAddress: eoaAccount.address,
      index: 0n,
      attesters: [RHINESTONE_ATTESTER_ADDRESS],
      attesterThreshold: 1
    })

    expect(factoryData).toMatchInlineSnapshot(
      `"0x0d51f0b70000000000000000000000003079b249dfde4692d7844aa261f8cf7d927a0da50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000333034e9f539ce08819e12c1b8cb29084d"`
    )
  })

  test("should check factory data with mee", async () => {
    const factoryData = await getMeeFactoryData({
      signerAddress: eoaAccount.address,
      index: 0n,
      attesters: [MEE_VALIDATOR_ADDRESS],
      attesterThreshold: 1,
      validatorAddress: MEE_VALIDATOR_ADDRESS,
      publicClient: testClient as unknown as PublicClient,
      walletClient
    })

    expect(factoryData).toMatchInlineSnapshot(
      `"0xea6d13ac0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000f5b753fdd20c5ca2d7c1210b3ab1ea59030000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000012401fe9ff2000000000000000000000000068ea3e30788abafdc6fd0b38d20bd38a40a2b3d00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000069e2a187aeffb852bf3ccdc95151b200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000143079b249dfde4692d7844aa261f8cf7d927a0da50000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000068ea3e30788abafdc6fd0b38d20bd38a40a2b3d00000000000000000000000000000000000000000000000000000000"`
    )
  })
})
