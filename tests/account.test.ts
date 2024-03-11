import { beforeAll, describe, expect, test } from "vitest"

import {
  http,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  zeroAddress
} from "viem"
import type { PublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { SmartAccountClient } from "~@biconomy/core/client/createSmartAccountClient.js"
import {
  type UserOperationStruct,
  createSmartAccount,
  walletClientToSmartAccountSigner
} from "../src/account/index.js"
import { DEFAULT_ECDSA_OWNERSHIP_MODULE } from "../src/account/utils/constants.js"
import { SignTransactionNotSupportedBySmartAccount } from "../src/account/utils/errors.js"
import { getChain } from "../src/account/utils/helpers.js"
import { extractChainIdFromBundlerUrl } from "../src/bundler/utils/helpers.js"

describe("Biconomy Smart Account core tests", () => {
  let smartAccount: Awaited<ReturnType<typeof createSmartAccount>>
  let walletClient: WalletClient
  let publicClient: PublicClient

  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`)
  const bundlerUrl = process.env.BUNDLER_URL ?? ""
  const chainId = extractChainIdFromBundlerUrl(bundlerUrl)
  const chain = getChain(chainId)

  beforeAll(async () => {
    // @ts-ignore
    publicClient = createPublicClient({
      chain,
      transport: http()
    })

    walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    })

    smartAccount = await createSmartAccount(publicClient, {
      signer: walletClientToSmartAccountSigner(walletClient),
      bundlerUrl
    })
  })

  test("Should create a smart account client", async () => {
    const smartAccountClient: SmartAccountClient = createSmartAccountClient({
      account: smartAccount,
      entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
      chain: polygonMumbai,
      bundlerTransport: http(bundlerUrlMumbai)
    })

    console.log(smartAccountClient, "CLIENT")
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
    expect(sig).toBeDefined()
  })

  test("Client signMessage", async () => {
    const response = await smartAccount.signMessage({
      message: "hello world"
    })

    expect(response).toBeTypeOf("string")
    expect(response).toHaveLength(132)
    expect(response).toMatch(/^0x[0-9a-fA-F]{130}$/)
  })

  test("should throw error if chainId from bundler and client do not match", async () => {
    const wrongBundlerUrl =
      "https://bundler.biconomy.io/api/v2/1/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"
    const config = {
      signer: walletClientToSmartAccountSigner(walletClient),
      bundlerUrl: wrongBundlerUrl
    }
    await expect(createSmartAccount(publicClient, config)).rejects.toThrow(
      "ChainId from bundler and client do not match"
    )
  })

  test("smart account should have ECDSA as default validation module", async () => {
    const defaultValidationModule = smartAccount.defaultValidationModule
    expect(defaultValidationModule.getModuleAddress()).toBe(
      DEFAULT_ECDSA_OWNERSHIP_MODULE
    )
  })

  test("Smart account client signTypedData", async () => {
    const response = await smartAccount.signTypedData({
      domain: {
        chainId: 1,
        name: "Test",
        verifyingContract: zeroAddress
      },
      primaryType: "Test",
      types: {
        Test: [
          {
            name: "test",
            type: "string"
          }
        ]
      },
      message: {
        test: "hello world"
      }
    })

    expect(response).toBeTypeOf("string")
    expect(response).toHaveLength(132)
    expect(response).toMatch(/^0x[0-9a-fA-F]{130}$/)
  })

  test("should throw with custom error SignTransactionNotSupportedBySmartAccount", async () => {
    const response = smartAccount.signTransaction({
      to: zeroAddress,
      value: 0n,
      data: "0x"
    })
    expect(response).rejects.toThrow(SignTransactionNotSupportedBySmartAccount)
  })
})
