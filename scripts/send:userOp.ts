import { config } from "dotenv"
import { http, createPublicClient } from "viem"
import { createPaymasterClient } from "viem/account-abstraction"
import { privateKeyToAccount } from "viem/accounts"
import { toNexusAccount } from "../src/sdk/account/toNexusAccount"
import { getChain } from "../src/sdk/account/utils/getChain"
import { createBicoBundlerClient } from "../src/sdk/clients/createBicoBundlerClient"
import { biconomyPaymasterContext } from "../src/sdk/clients/createBicoPaymasterClient"

config()

export const getConfig = () => {
  const chainId = Number.parseInt(process.env.CHAIN_ID || "0")
  const chain = getChain(chainId)
  return {
    chain,
    chainId,
    bundlerUrl: process.env.BUNDLER_URL || "",
    privateKey: process.env.PRIVATE_KEY || "",
    paymasterUrl: process.env.PAYMASTER_URL || ""
  }
}

const { chain, privateKey, bundlerUrl, paymasterUrl } = getConfig()

if ([chain, privateKey, bundlerUrl].every(Boolean) !== true)
  throw new Error("Missing env vars")

if (!paymasterUrl) console.log("Missing paymaster url")

const account = privateKeyToAccount(`0x${privateKey}`)
const recipient = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth

const publicClient = createPublicClient({
  chain,
  transport: http()
})

const main = async () => {
  const nexusAccount = await toNexusAccount({
    signer: account,
    chain,
    transport: http()
  })

  const nexusBalance = await publicClient.getBalance({
    address: nexusAccount.address
  })

  if (nexusBalance === 0n) {
    throw new Error(`Insufficient balance at address: ${nexusAccount.address}`)
  }

  const bicoBundler = createBicoBundlerClient({
    chain,
    bundlerUrl,
    account: nexusAccount,
    ...(paymasterUrl
      ? {
          paymaster: createPaymasterClient({
            transport: http(paymasterUrl)
          }),
          paymasterContext: biconomyPaymasterContext
        }
      : undefined),
    userOperation: {
      estimateFeesPerGas: async (_) => {
        const feeData = await bicoBundler.getGasFeeValues()
        return feeData.fast
      }
    }
  })

  const usesAltoBundler = process.env.BUNDLER_URL?.includes("pimlico")
  console.time("read methods")
  const results = await Promise.allSettled([
    bicoBundler.getChainId(),
    bicoBundler.getSupportedEntryPoints(),
    bicoBundler.prepareUserOperation({
      calls: [
        {
          to: recipient,
          value: 1n
        }
      ],
      account: nexusAccount
    })
  ])
  console.timeEnd("read methods")

  const successCount = results.filter((result) => result.status === "fulfilled")
  const failures = results.filter((result) => result.status === "rejected")
  console.log(
    `running the ${usesAltoBundler ? "Alto" : "Bico"} bundler with ${
      successCount.length
    } successful calls and ${results.length - successCount.length} failed calls`
  )

  if (failures.length > 0) {
    console.log({ failures })
    process.exit(1)
  }

  console.time("write methods")
  const hash = await bicoBundler.sendUserOperation({
    calls: [
      {
        to: recipient,
        value: 1n
      }
    ],
    account: nexusAccount
  })
  const userOpReceipt = await bicoBundler.waitForUserOperationReceipt({ hash })
  const { transactionHash } = await publicClient.waitForTransactionReceipt({
    hash: userOpReceipt.receipt.transactionHash
  })
  console.timeEnd("write methods")
  console.log({ transactionHash })
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
