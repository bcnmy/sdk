import { http, createPublicClient, createWalletClient, zeroAddress } from "viem"
import { describe, expect, it } from "vitest"

import { privateKeyToAccount } from "viem/accounts"
import {
  getUserOperationHash,
  walletClientToSmartAccountSigner
} from "../../src/accounts/utils/helpers.js"
import { createBundlerClient } from "../../src/bundler/createBundlerClient.js"
import {
  createSmartAccountClient,
  signerToSmartAccount
} from "../../src/index.js"
import { getChainConfig } from "../utils.js"

describe("Bundler tests", () => {
  const { bundlerUrl, chain } = getChainConfig()
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  })
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })

  it("Should have the properties of a viem client", async () => {
    const bundlerClient = createBundlerClient({
      chain,
      transport: http(bundlerUrl)
    })
    expect(bundlerClient.uid).toBeDefined()
    expect(bundlerClient?.chain?.id).toBe(chain.id)
    expect(bundlerClient.pollingInterval).toBeDefined()
  })

  it("Should have a bundler specific action", async () => {
    const bundlerClient = createBundlerClient({
      chain,
      transport: http(bundlerUrl)
    })
    expect(await bundlerClient.chainId()).toBe(chain.id)
  })

  it("Should get user op status", async () => {
    const bundlerClient = createBundlerClient({
      chain,
      transport: http(bundlerUrl)
    })

    const userOpHash =
      "0xebea403d4701fe950c4fe4aeb117e457a930b843238430b9cc8c3cf502bb2cb0"

    const status = await bundlerClient.getUserOpStatus(userOpHash)
    console.log("User Operation Status: ", status)
  }, 35000)

  it("Should get user op receipt", async () => {
    const bundlerClient = createBundlerClient({
      chain,
      transport: http(bundlerUrl)
    })

    const userOpHash =
      "0xebea403d4701fe950c4fe4aeb117e457a930b843238430b9cc8c3cf502bb2cb0"

    const receipt = await bundlerClient.getUserOperationReceipt({
      hash: userOpHash
    })
    console.log("User Operation Receipt: ", receipt)
  }, 35000)
})
