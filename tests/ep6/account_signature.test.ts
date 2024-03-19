import { baseSepolia } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"

import { http, createPublicClient, createWalletClient } from "viem"
import type { Client, PublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { walletClientToSmartAccountSigner } from "permissionless"
import {
  createSmartAccountClient,
  signerToSmartAccount
} from "../../src/index.js"

describe("Biconomy Smart Account V2 EP v6 - Signature tests", () => {
  let smartAccount: Awaited<ReturnType<typeof signerToSmartAccount>>
  let walletClient: Client
  let publicClient: PublicClient
  let smartAccountClient: Awaited<ReturnType<typeof createSmartAccountClient>>

  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)
  const bundlerUrl = process.env.BUNDLER_URL ?? ""
  const chain = baseSepolia

  beforeAll(async () => {
    publicClient = createPublicClient({
      transport: http("https://public.stackup.sh/api/v1/node/base-sepolia")
    })

    walletClient = createWalletClient({
      account,
      chain,
      transport: http("https://public.stackup.sh/api/v1/node/base-sepolia")
    })

    smartAccount = await signerToSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient)
    })

    smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain,
      bundlerTransport: http(bundlerUrl)
    })
  })

  // test("verifySignature of deployed", async () => {
  //   const message = "hello world"

  //   const signature = await smartAccountClient.signMessage({
  //     message
  //   })

  //   const isVerified = await publicClient.verifyMessage({
  //     address: smartAccountClient.account.address,
  //     message,
  //     signature
  //   })

  //   expect(isVerified).toBeTruthy()
  // })

  // test("verifySignature of not deployed", async () => {
  //   const initialEcdsaSmartAccount = await signerToSmartAccount(publicClient, {
  //     signer: walletClientToSmartAccountSigner(walletClient),
  //     index: 10000n
  //   })

  //   const smartAccountClient = createSmartAccountClient({
  //     account: initialEcdsaSmartAccount,
  //     chain,
  //     bundlerTransport: http(bundlerUrl)
  //   })

  //   const message = "hello world"

  //   const signature = await smartAccountClient.signMessage({
  //     message
  //   })

  //   const isVerified = await publicClient.verifyMessage({
  //     address: smartAccountClient.account.address,
  //     message,
  //     signature
  //   })

  //   expect(isVerified).toBeTruthy()
  // })

  // test("verifySignature with signTypedData", async () => {
  //   const initialEcdsaSmartAccount = await signerToSmartAccount(publicClient, {
  //     signer: walletClientToSmartAccountSigner(walletClient)
  //   })

  //   const smartAccountClient = createSmartAccountClient({
  //     account: initialEcdsaSmartAccount,
  //     chain,
  //     bundlerTransport: http(bundlerUrl)
  //   })

  //   const signature = await smartAccountClient.signTypedData({
  //     domain: {
  //       name: "Ether Mail",
  //       version: "1",
  //       chainId: 1,
  //       verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
  //     },
  //     types: {
  //       Person: [
  //         { name: "name", type: "string" },
  //         { name: "wallet", type: "address" }
  //       ],
  //       Mail: [
  //         { name: "from", type: "Person" },
  //         { name: "to", type: "Person" },
  //         { name: "contents", type: "string" }
  //       ]
  //     },
  //     primaryType: "Mail",
  //     message: {
  //       from: {
  //         name: "Cow",
  //         wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
  //       },
  //       to: {
  //         name: "Bob",
  //         wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
  //       },
  //       contents: "Hello, Bob!"
  //     }
  //   })

  //   const isVerified = await publicClient.verifyTypedData({
  //     address: smartAccountClient.account.address,
  //     domain: {
  //       name: "Ether Mail",
  //       version: "1",
  //       chainId: 1,
  //       verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
  //     },
  //     types: {
  //       Person: [
  //         { name: "name", type: "string" },
  //         { name: "wallet", type: "address" }
  //       ],
  //       Mail: [
  //         { name: "from", type: "Person" },
  //         { name: "to", type: "Person" },
  //         { name: "contents", type: "string" }
  //       ]
  //     },
  //     primaryType: "Mail",
  //     message: {
  //       from: {
  //         name: "Cow",
  //         wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
  //       },
  //       to: {
  //         name: "Bob",
  //         wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
  //       },
  //       contents: "Hello, Bob!"
  //     },
  //     signature
  //   })

  //   expect(isVerified).toBeTruthy()
  // })

  // test("verifySignature with signTypedData for not deployed", async () => {
  //   const initialEcdsaSmartAccount = await signerToSmartAccount(publicClient, {
  //     signer: walletClientToSmartAccountSigner(walletClient)
  //   })

  //   const smartAccountClient = createSmartAccountClient({
  //     account: initialEcdsaSmartAccount,
  //     chain,
  //     bundlerTransport: http(bundlerUrl)
  //   })

  //   const signature = await smartAccountClient.signTypedData({
  //     domain: {
  //       name: "Ether Mail",
  //       version: "1",
  //       chainId: 1,
  //       verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
  //     },
  //     types: {
  //       Person: [
  //         { name: "name", type: "string" },
  //         { name: "wallet", type: "address" }
  //       ],
  //       Mail: [
  //         { name: "from", type: "Person" },
  //         { name: "to", type: "Person" },
  //         { name: "contents", type: "string" }
  //       ]
  //     },
  //     primaryType: "Mail",
  //     message: {
  //       from: {
  //         name: "Cow",
  //         wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
  //       },
  //       to: {
  //         name: "Bob",
  //         wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
  //       },
  //       contents: "Hello, Bob!"
  //     }
  //   })

  //   const isVerified = await publicClient.verifyTypedData({
  //     address: smartAccountClient.account.address,
  //     domain: {
  //       name: "Ether Mail",
  //       version: "1",
  //       chainId: 1,
  //       verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
  //     },
  //     types: {
  //       Person: [
  //         { name: "name", type: "string" },
  //         { name: "wallet", type: "address" }
  //       ],
  //       Mail: [
  //         { name: "from", type: "Person" },
  //         { name: "to", type: "Person" },
  //         { name: "contents", type: "string" }
  //       ]
  //     },
  //     primaryType: "Mail",
  //     message: {
  //       from: {
  //         name: "Cow",
  //         wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
  //       },
  //       to: {
  //         name: "Bob",
  //         wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
  //       },
  //       contents: "Hello, Bob!"
  //     },
  //     signature
  //   })

  //   expect(isVerified).toBeTruthy()
  // })
})
