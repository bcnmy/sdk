import { http } from "viem"
import { describe, expect, it } from "vitest"

import { getChain } from "../src/accounts/utils/helpers.js"
import { createPaymasterClient } from "../src/paymaster/createPaymasterClient.js"
import { extractChainIdFromPaymasterUrl } from "../src/paymaster/utils/helpers.js"

describe("Paymaster tests", () => {
  const paymasterUrl = process.env.PAYMASTER_URL ?? ""
  const chainId = extractChainIdFromPaymasterUrl(paymasterUrl)
  const chain = getChain(chainId)

  it("Should have the properties of a viem client", async () => {
    const paymasterClient = createPaymasterClient({
      chain,
      transport: http(paymasterUrl)
    })
    expect(paymasterClient.uid).toBeDefined()
    expect(paymasterClient?.chain?.id).toBe(chainId)
    expect(paymasterClient.pollingInterval).toBeDefined()
  })

  it("Should have a paymaster specific action", async () => {
    const paymasterClient = createPaymasterClient({
      chain,
      transport: http(paymasterUrl)
    })
    const result = await paymasterClient.sponsorUserOperation()
    expect(result).toBeTruthy()
  })
})
