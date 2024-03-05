import { beforeAll, describe, expect, test } from "vitest"

import {
  http,
  WalletClient,
  createPublicClient,
  createWalletClient
} from "viem"
import { type PublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { polygonMumbai } from "viem/chains"

import {
  UserOperationStruct,
  walletClientToSmartAccountSigner
} from "~@bico/core/account/index.js"
import { createBiconomySmartAccount } from "../packages/core/account/index.js"

describe("Biconomy Smart Account core tests", () => {
  let smartAccount: Awaited<ReturnType<typeof createBiconomySmartAccount>>
  let walletClient: WalletClient
  let publicClient: PublicClient
  const bundlerUrlMumbai =
    "https://bundler.biconomy.io/api/v2/80001/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"

  beforeAll(async () => {
    const wallet = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)

    publicClient = createPublicClient({
      transport: http(polygonMumbai.rpcUrls.default.http[0])
    })

    walletClient = createWalletClient({
      account: wallet,
      transport: http(polygonMumbai.rpcUrls.default.http[0])
    })

    smartAccount = await createBiconomySmartAccount(publicClient, {
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

  test("Should sign a user operation", async () => {
    const userOp: UserOperationStruct = {
      sender: "0x99F3Bc8058503960364Ef3fDBF6407C9b0BbefCc",
      nonce: BigInt(0),
      initCode:
        "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5df20ffbc0000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000242ede3bc0000000000000000000000000d3c85fdd3695aee3f0a12b3376acd8dc5402054900000000000000000000000000000000000000000000000000000000",
      callData:
        "0x0000189a000000000000000000000000463cd2b5e4f059265b9520ef878bda456d8a350600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000006442842e0e00000000000000000000000099f3bc8058503960364ef3fdbf6407c9b0bbefcc000000000000000000000000c7f0ea744e33fe599fb4d25ecb7440ccbc3cf9b2000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000",
      signature:
        "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000001c5b32F37F5beA87BDD5374eB2aC54eA8e000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000",
      paymasterAndData: "0x",
      callGasLimit: 0n,
      verificationGasLimit: 0n,
      preVerificationGas: 0n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n
    }

    const sig = await smartAccount.signUserOperation(userOp)
    console.log("User Operation Signature: ", sig)
  })

  test("should throw error if chainId from bundler and client do not match", async () => {
    const wrongBundlerUrl =
      "https://bundler.biconomy.io/api/v2/1/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"
    const config = {
      signer: walletClientToSmartAccountSigner(walletClient),
      bundlerUrl: wrongBundlerUrl
    }
    await expect(
      createBiconomySmartAccount(publicClient, config)
    ).rejects.toThrow("ChainId from bundler and client do not match")
  })
})
