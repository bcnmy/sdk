import {
  http,
  type Chain,
  type PrivateKeyAccount,
  isAddress,
  isHex
} from "viem"
import { base, optimism, optimismSepolia } from "viem/chains"
import { baseSepolia } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import type { NetworkConfig } from "../../../test/testUtils"
import { MEE_VALIDATOR_ADDRESS, TEMP_MEE_ATTESTER_ADDR } from "../../constants"
import { NEXUS_ACCOUNT_FACTORY } from "../../constants"
import { mcUSDC } from "../../constants/tokens"
import { toNexusAccount } from "../toNexusAccount"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "./toMultiChainNexusAccount"

describe("mee.toMultiChainNexusAccount", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  let eoaAccount: PrivateKeyAccount
  let mcNexusTestnet: MultichainSmartAccount
  let mcNexusMainnet: MultichainSmartAccount

  beforeAll(async () => {
    network = await toNetwork("TESTNET_FROM_ENV_VARS")

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = network.account!
  })

  test("should create multichain account with correct parameters", async () => {
    mcNexusTestnet = await toMultichainNexusAccount({
      signer: eoaAccount,
      chains: [baseSepolia, optimismSepolia]
    })

    mcNexusMainnet = await toMultichainNexusAccount({
      signer: eoaAccount,
      chains: [base, optimism]
    })

    // Verify the structure of the returned object
    expect(mcNexusMainnet).toHaveProperty("deployments")
    expect(mcNexusMainnet).toHaveProperty("signer")
    expect(mcNexusMainnet).toHaveProperty("deploymentOn")
    expect(mcNexusMainnet.signer).toBe(eoaAccount)
    expect(mcNexusMainnet.deployments).toHaveLength(2)

    expect(mcNexusTestnet.deployments).toHaveLength(2)
    expect(mcNexusTestnet.signer).toBe(eoaAccount)
    expect(mcNexusTestnet.deployments).toHaveLength(2)
  })

  test("should return correct deployment for specific chain", async () => {
    const deployment = mcNexusTestnet.deploymentOn(baseSepolia.id)
    expect(deployment).toBeDefined()
    expect(deployment.client.chain?.id).toBe(baseSepolia.id)
  })

  test("should throw error for non-existent chain deployment", async () => {
    expect(() => mcNexusTestnet.deploymentOn(999)).toThrow(
      "No account deployment for chainId: 999"
    )
  })

  test("should handle empty chains array", async () => {
    const multiChainAccount = await toMultichainNexusAccount({
      signer: eoaAccount,
      chains: []
    })
    expect(multiChainAccount.deployments).toHaveLength(0)
  })

  test("should have configured accounts correctly", async () => {
    expect(mcNexusMainnet.deployments.length).toEqual(2)
    expect(mcNexusTestnet.deployments.length).toEqual(2)
    expect(mcNexusTestnet.deploymentOn(baseSepolia.id).address).toEqual(
      mcNexusTestnet.deploymentOn(baseSepolia.id).address
    )
  })

  test("should sign message using MEE Compliant Nexus Account", async () => {
    const nexus = await toNexusAccount({
      chain: baseSepolia,
      signer: eoaAccount,
      transport: http(),
      validatorAddress: MEE_VALIDATOR_ADDRESS,
      factoryAddress: NEXUS_ACCOUNT_FACTORY,
      attesters: [TEMP_MEE_ATTESTER_ADDR]
    })

    expect(isAddress(nexus.address)).toBeTruthy()

    const signed = await nexus.signMessage({ message: { raw: "0xABC" } })
    expect(isHex(signed)).toBeTruthy()
  })

  test("should read usdc balance on mainnet", async () => {
    const readAddress = mcNexusMainnet.deploymentOn(optimism.id).address
    const usdcBalanceOnChains = await mcUSDC.read({
      account: mcNexusMainnet,
      functionName: "balanceOf",
      args: [readAddress],
      onChains: [base, optimism]
    })

    expect(usdcBalanceOnChains.length).toEqual(2)
  })
})
