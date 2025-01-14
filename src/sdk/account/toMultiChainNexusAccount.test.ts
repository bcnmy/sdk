import {
  http,
  type Address,
  type Chain,
  type LocalAccount,
  isAddress,
  isHex
} from "viem"
import { base, optimism } from "viem/chains"
import { baseSepolia } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import { toNetwork } from "../../test/testSetup"
import type { NetworkConfig } from "../../test/testUtils"
import { MEE_VALIDATOR_ADDRESS, TEMP_MEE_ATTESTER_ADDR } from "../constants"
import { NEXUS_ACCOUNT_FACTORY } from "../constants"
import { mcUSDC } from "../constants/tokens"
import { MeeSmartAccount } from "../modules"
import {
  type MultichainSmartAccount,
  toMultichainNexusAccount
} from "./toMultiChainNexusAccount"
import { toNexusAccount } from "./toNexusAccount"

describe("mee.toMultiChainNexusAccount", async () => {
  let network: NetworkConfig
  let eoaAccount: LocalAccount
  let paymentChain: Chain
  let paymentToken: Address
  let mcNexus: MultichainSmartAccount

  beforeAll(async () => {
    network = await toNetwork("MAINNET_FROM_ENV_VARS")

    paymentChain = network.chain
    paymentToken = network.paymentToken!
    eoaAccount = network.account!

    mcNexus = await toMultichainNexusAccount({
      chains: [base, paymentChain],
      signer: eoaAccount
    })
  })

  test("should create multichain account with correct parameters", async () => {
    mcNexus = await toMultichainNexusAccount({
      signer: eoaAccount,
      chains: [base, optimism]
    })

    // Verify the structure of the returned object
    expect(mcNexus).toHaveProperty("deployments")
    expect(mcNexus).toHaveProperty("signer")
    expect(mcNexus).toHaveProperty("deploymentOn")
    expect(mcNexus.signer).toBe(eoaAccount)
    expect(mcNexus.deployments).toHaveLength(2)
  })

  test("should return correct deployment for specific chain", async () => {
    const deployment = mcNexus.deploymentOn(base.id)
    expect(deployment).toBeDefined()
    expect(deployment?.client?.chain?.id).toBe(base.id)
  })

  test("should handle empty chains array", async () => {
    const multiChainAccount = await toMultichainNexusAccount({
      signer: eoaAccount,
      chains: []
    })
    expect(multiChainAccount.deployments).toHaveLength(0)
  })

  test("should have configured accounts correctly", async () => {
    expect(mcNexus.deployments.length).toEqual(2)
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
    const readAddress = mcNexus.deploymentOn(optimism.id)?.address
    if (!readAddress) {
      throw new Error("No address found for optimism")
    }
    const usdcBalanceOnChains = await mcUSDC.read({
      account: mcNexus,
      functionName: "balanceOf",
      args: [readAddress],
      onChains: [base, optimism]
    })

    expect(usdcBalanceOnChains.length).toEqual(2)
  })

  test("mcNexus to have decorators successfully applied", async () => {
    expect(mcNexus.getUnifiedERC20Balance).toBeInstanceOf(Function)
    expect(mcNexus.buildBalanceInstructions).toBeInstanceOf(Function)
    expect(mcNexus.buildBridgeInstructions).toBeInstanceOf(Function)
    expect(mcNexus.queryBridge).toBeDefined()
  })

  test("should query bridge", async () => {
    const unifiedBalance = await mcNexus.getUnifiedERC20Balance(mcUSDC)

    const tokenMapping = {
      on: (chainId: number) =>
        unifiedBalance.token.deployments.get(chainId) || "0x",
      deployments: Array.from(
        unifiedBalance.token.deployments.entries(),
        ([chainId, address]) => ({ chainId, address })
      )
    }

    const payload = await mcNexus.queryBridge({
      amount: 18600927n,
      toChain: base,
      fromChain: paymentChain,
      tokenMapping,
      account: mcNexus
    })

    expect(payload?.amount).toBeGreaterThan(0n)
    expect(payload?.receivedAtDestination).toBeGreaterThan(0n)
  })
})
