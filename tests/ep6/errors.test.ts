import {
  http,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import { createSmartAccountClient, signerToSmartAccount } from "../../src"
import { ERRORS_URL } from "../../src/accounts/utils/errors/getters/getBundlerError"
import { walletClientToSmartAccountSigner } from "../../src/accounts/utils/helpers"
import type { KnownError } from "../../src/accounts/utils/types"
import { getChainConfig } from "../utils"

describe("Errors", () => {
  const { bundlerUrl, chain } = getChainConfig()
  const randomPrivateKey = generatePrivateKey()
  const account = privateKeyToAccount(randomPrivateKey)
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const errors: KnownError[] = []

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http()
  })
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })
  let smartAccount: Awaited<ReturnType<typeof signerToSmartAccount>>
  let smartAccountClient: ReturnType<typeof createSmartAccountClient>

  beforeAll(async () => {
    smartAccount = await signerToSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient)
    })
    const _errors = await (await fetch(ERRORS_URL)).json()
    errors.push(..._errors)
  })

  test("should fail and give advice", async () => {
    const relevantError = errors.find(
      (error: KnownError) => error.regex === "aa21"
    )

    smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain,
      bundlerTransport: http(bundlerUrl)
    })

    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address to) public"]),
      functionName: "safeMint",
      args: [smartAccount.address]
    })

    await expect(
      smartAccountClient.sendTransaction({
        to: nftAddress,
        data: encodedCall
      })
    ).rejects.toThrowError("AA21: SmartAccountInsufficientFundsError")

    await expect(
      smartAccountClient.sendTransaction({
        to: nftAddress,
        data: encodedCall
      })
    ).rejects.toThrowError(relevantError?.solutions[0])
  }, 50000)
})
