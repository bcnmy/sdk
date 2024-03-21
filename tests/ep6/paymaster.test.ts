import {
  http,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbi,
  zeroAddress
} from "viem"
import { describe, expect, test } from "vitest"

import { privateKeyToAccount } from "viem/accounts"
import { base, baseSepolia } from "viem/chains"
import {
  getChain,
  walletClientToSmartAccountSigner
} from "../../src/accounts/utils/helpers.js"
import { createBundlerClient } from "../../src/bundler/createBundlerClient.js"
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
    chain,
    transport: http(baseSepolia.rpcUrls.default.http[0])
  })

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(baseSepolia.rpcUrls.default.http[0])
  })

  const smartAccount = await signerToSmartAccount(publicClient, {
    signer: walletClientToSmartAccountSigner(walletClient)
  })

  const bundlerClient = createBundlerClient({
    transport: http(bundlerUrl)
  })

  const smartAccountClient = createSmartAccountClient({
    account: smartAccount,
    chain,
    bundlerTransport: http(bundlerUrl)
  })

  test("Should have the properties of a viem client", async () => {
    const paymasterClient = createPaymasterClient({
      chain,
      transport: http(paymasterUrl)
    })
    expect(paymasterClient.uid).toBeDefined()
    expect(paymasterClient?.chain?.id).toBe(chainId)
    expect(paymasterClient.pollingInterval).toBeDefined()
  })

  test("Should return sponsored user operation values", async () => {
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
      }
    })

    const result = await paymasterClient.sponsorUserOperation({
      userOperation: userOp,
      mode: PaymasterMode.SPONSORED
    })

    expect(result).toBeTruthy()
  })

  // test("Should send a sponsored user operation using sendUserOperation", async () => {
  //   const paymasterClient = createPaymasterClient({
  //     transport: http(paymasterUrl)
  //   })
  //   const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  //   const encodedCall = encodeFunctionData({
  //     abi: parseAbi(["function safeMint(address to) public"]),
  //     functionName: "safeMint",
  //     args: [smartAccount.address]
  //   })

  //   const userOp = await smartAccountClient.prepareUserOperationRequest({
  //     userOperation: {
  //       callData: await smartAccountClient.account.encodeCallData({
  //         to: nftAddress,
  //         value: 0n,
  //         data: encodedCall
  //       })
  //     }
  //   })

  //   const sponsoredSmartAccountClient = createSmartAccountClient({
  //     account: smartAccount,
  //     chain,
  //     bundlerTransport: http(bundlerUrl),
  //     middleware: {
  //       gasPrice: async () => {
  //         const {
  //           maxFeePerGas,
  //           maxPriorityFeePerGas
  //         } = await bundlerClient.getGasFeeValues()
  //         console.log(maxFeePerGas, maxPriorityFeePerGas, "maxFeePerGas, maxPriorityFeePerGas");
  //         return {maxFeePerGas, maxPriorityFeePerGas};
  //       },
  //       sponsorUserOperation: paymasterClient.sponsorUserOperation,
  //     }
  //   })

  //   console.log(userOpHash, "userOp");

  //   const userOpHash = await sponsoredSmartAccountClient.sendUserOperation({
  //     userOperation: userOp,
  //   })

  //   expect(userOpHash).toBeTruthy()
  // }, 50000)

  test("Should send a sponsored user operation using sendTransaction", async () => {
    const paymasterClient = createPaymasterClient({
      transport: http(paymasterUrl)
    })
    const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
    const encodedCall = encodeFunctionData({
      abi: parseAbi(["function safeMint(address to) public"]),
      functionName: "safeMint",
      args: [smartAccount.address]
    })

    const sponsoredSmartAccountClient = createSmartAccountClient({
      account: smartAccount,
      chain,
      bundlerTransport: http(bundlerUrl),
      middleware: {
        gasPrice: async () => {
          const { maxFeePerGas, maxPriorityFeePerGas } =
            await bundlerClient.getGasFeeValues()
          return { maxFeePerGas, maxPriorityFeePerGas }
        },
        sponsorUserOperation: paymasterClient.sponsorUserOperation
      }
    })

    const userOpHash = await sponsoredSmartAccountClient.sendTransaction({
      to: nftAddress,
      value: 0n,
      data: encodedCall
    })

    console.log(userOpHash, "result")

    expect(userOpHash).toBeTruthy()
  }, 50000)
})
