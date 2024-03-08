import { beforeAll, describe, expect, test } from "vitest"

import {
  http,
  type WalletClient,
  createPublicClient,
  createWalletClient
} from "viem"
import type { PublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { getChain } from "~@biconomy/core/account/utils/helpers.js"
import { extractChainIdFromBundlerUrl } from "~@biconomy/core/bundler/utils/helpers.js"
import { DEFAULT_ECDSA_OWNERSHIP_MODULE } from "~@biconomy/core/common/index.js"
import {
  createSmartAccount,
  walletClientToSmartAccountSigner
} from "../../packages/core/account/index.js"

describe("Biconomy Smart Account core tests", () => {
  let smartAccount: Awaited<ReturnType<typeof createSmartAccount>>
  let walletClient: WalletClient
  let publicClient: PublicClient

  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)
  const bundlerUrl = process.env.BUNDLER_URL
  const chainId = extractChainIdFromBundlerUrl(bundlerUrl ?? "")
  const chain = getChain(chainId)

  beforeAll(async () => {
    // @ts-ignore
    publicClient = createPublicClient({
      chain,
      transport: http()
    })

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    smartAccount = await createSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient),
      bundlerUrl: bundlerUrl
    })
  })

  test("Should get account address + nonce", async () => {
    const address = smartAccount.address
    console.log("Smart Account Address: ", address)

    const nonce = await smartAccount.getNonce()
    console.log("Smart Account Nonce: ", nonce)
  })

  test("should get validation module address", async () => {
    const response = smartAccount.defaultValidationModule.getModuleAddress()
    console.log("Validation Module Address: ", response)
    expect(response).toBe(DEFAULT_ECDSA_OWNERSHIP_MODULE)
  })

  test("should get validation module signer", async () => {
    const response = await smartAccount.defaultValidationModule.getSigner()
    console.log("Validation Module signer: ", response)
    expect(response.address).toBe(walletClient.account.address)
  })
})
