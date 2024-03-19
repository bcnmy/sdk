import { http } from "viem"
import { describe, expect, it } from "vitest"

import { getChain } from "../../src/accounts/utils/helpers.js"
import { createBundlerClient } from "../../src/bundler/createBundlerClient.js"
import { extractChainIdFromBundlerUrl } from "../../src/bundler/utils/helpers.js"

describe("Bundler tests", () => {
  const bundlerUrl = process.env.BUNDLER_URL ?? ""
  const chainId = extractChainIdFromBundlerUrl(bundlerUrl)
  const chain = getChain(chainId)

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
