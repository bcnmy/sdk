import { http } from "viem"
import { describe, expect, it } from "vitest"

import { privateKeyToAccount } from "viem/accounts"
import { getChain } from "../src/account/utils/helpers.js"
import { createPaymasterClient } from "../src/paymaster/createPaymasterClient.js"
import { extractChainIdFromPaymasterUrl } from "../src/paymaster/utils/helpers.js"

describe("Paymaster tests", () => {
  const paymasterUrl = process.env.PAYMASTER_URL ?? ""
  const chainId = extractChainIdFromPaymasterUrl(paymasterUrl)
  const chain = getChain(chainId)
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)

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
