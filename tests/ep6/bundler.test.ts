import { http } from "viem"
import { describe, expect, it } from "vitest"

import { privateKeyToAccount } from "viem/accounts"
import { createBundlerClient } from "../../src/bundler/createBundlerClient.js"
import { getChainConfig } from "../utils.js"

describe("Bundler tests", () => {
  const { bundlerUrl, chainId, chain } = getChainConfig()

  it("Should have the properties of a viem client", async () => {
    const bundlerClient = createBundlerClient({
      chain,
      transport: http(bundlerUrl)
    })
    expect(bundlerClient.uid).toBeDefined()
    expect(bundlerClient?.chain?.id).toBe(chainId)
    expect(bundlerClient.pollingInterval).toBeDefined()
  })

  it("Should have a bundler specific action", async () => {
    const bundlerClient = createBundlerClient({
      chain,
      transport: http(bundlerUrl)
    })
    expect(await bundlerClient.chainId()).toBe(chainId)
  })
})
