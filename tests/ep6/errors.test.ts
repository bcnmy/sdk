import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi
} from "viem"
import { beforeAll, describe, expect, test } from "vitest"
import { getChainConfig } from "../utils"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { signerToSmartAccount, createSmartAccountClient } from "../../src"
import { walletClientToSmartAccountSigner } from "../../src/accounts/utils/helpers"

describe("Errors", () => {
  const { bundlerUrl, chain } = getChainConfig()
  const randomPrivateKey = generatePrivateKey()
  const account = privateKeyToAccount(randomPrivateKey)
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
  let smartAccount: Awaited<ReturnType<typeof signerToSmartAccount>>
  let smartAccountClient: ReturnType<typeof createSmartAccountClient>

  beforeAll(async () => {
    smartAccount = await signerToSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient)
    })
  })

  test("should fail to mint an NFT and pay for the gas", async () => {
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

    const txHash = await smartAccountClient.sendTransaction({
      to: nftAddress,
      data: encodedCall
    })

    expect(txHash).toBeDefined()
  }, 50000)
})
