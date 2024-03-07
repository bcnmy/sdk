import { beforeAll, describe, expect, expectTypeOf, test } from "vitest"

import {
  http,
  WalletClient,
  createPublicClient,
  createWalletClient,
  zeroAddress
} from "viem"
import { type PublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { polygonMumbai } from "viem/chains"

import { DEFAULT_ECDSA_OWNERSHIP_MODULE } from "~@biconomy/core/common/index.js"
import {
  UserOperationStruct,
  createSmartAccount,
  walletClientToSmartAccountSigner
} from "../../packages/core/account/index.js"

describe("Biconomy Smart Account core tests", () => {
  let smartAccount: Awaited<ReturnType<typeof createSmartAccount>>
  let walletClient: WalletClient
  let publicClient: PublicClient
  const bundlerUrlMumbai =
    "https://bundler.biconomy.io/api/v2/80001/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"

  beforeAll(async () => {
    if (!process.env.PRIVATE_KEY)
      throw new Error("PRIVATE_KEY env variable is not set")
    const wallet = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)

    // @ts-ignore
    publicClient = createPublicClient({
      transport: http(polygonMumbai.rpcUrls.default.http[0])
    })

    walletClient = createWalletClient({
      account: wallet,
      transport: http(polygonMumbai.rpcUrls.default.http[0])
    })

    smartAccount = await createSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient),
      bundlerUrl: bundlerUrlMumbai
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
