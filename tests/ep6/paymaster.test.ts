import {
  http,
  Hex,
  createPublicClient,
  createWalletClient,
  toHex,
  zeroAddress
} from "viem"
import { describe, expect, it } from "vitest"

import { walletClientToSmartAccountSigner } from "permissionless"
import { privateKeyToAccount } from "viem/accounts"
import { getChain } from "../../src/accounts/utils/helpers.js"
import {
  createSmartAccountClient,
  signerToSmartAccount
} from "../../src/index.js"
import { createPaymasterClient } from "../../src/paymaster/createPaymasterClient.js"
import { extractChainIdFromPaymasterUrl } from "../../src/paymaster/utils/helpers.js"
import { PaymasterMode } from "../../src/paymaster/utils/types.js"

describe("Paymaster tests", async () => {
  const paymasterUrl = process.env.PAYMASTER_URL ?? ""
  const chainId = extractChainIdFromPaymasterUrl(paymasterUrl)
  const chain = getChain(chainId)
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)
  const bundlerUrl = process.env.BUNDLER_URL ?? ""

  const publicClient = createPublicClient({
    transport: http("https://public.stackup.sh/api/v1/node/base-sepolia")
  })

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http("https://public.stackup.sh/api/v1/node/base-sepolia")
  })

  const smartAccount = await signerToSmartAccount(publicClient, {
    signer: walletClientToSmartAccountSigner(walletClient)
  })

  const smartAccountClient = createSmartAccountClient({
    account: smartAccount,
    chain,
    bundlerTransport: http(bundlerUrl)
  })

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

    const userOp = await smartAccountClient.prepareUserOperationRequest({
      userOperation: {
        callData: await smartAccountClient.account.encodeCallData({
          to: zeroAddress,
          value: 0n,
          data: "0x"
        })
      },
      account: smartAccount
    })

    const result = await paymasterClient.sponsorUserOperation({
      userOperation: userOp,
      entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      mode: PaymasterMode.SPONSORED
    })
    expect(result).toBeTruthy()
  })
})
