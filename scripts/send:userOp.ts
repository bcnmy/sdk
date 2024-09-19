import { http, type PublicClient, parseEther } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { getChain } from "../src/sdk/account/utils/getChain"
import { createNexusClient } from "../src/sdk/clients/createNexusClient"

const k1ValidatorAddress = "0x663E709f60477f07885230E213b8149a7027239B"
const factoryAddress = "0x887Ca6FaFD62737D0E79A2b8Da41f0B15A864778"

export const getEnvVars = () => {
  return {
    bundlerUrl: process.env.BUNDLER_URL || "",
    privateKey: process.env.PRIVATE_KEY || "",
    paymasterUrl: process.env.PAYMASTER_URL || "",
    chainId: process.env.CHAIN_ID || "0"
  }
}

export const getConfig = () => {
  const {
    paymasterUrl,
    bundlerUrl,
    chainId: chainIdFromEnv,
    privateKey
  } = getEnvVars()

  const chains = [Number.parseInt(chainIdFromEnv)]
  const chainId = chains[0]
  const chain = getChain(chainId)

  return {
    chain,
    chainId,
    paymasterUrl,
    bundlerUrl,
    privateKey
  }
}

const { chain, privateKey, bundlerUrl } = getConfig()

if ([chain, privateKey, bundlerUrl].every(Boolean) !== true)
  throw new Error("Missing env vars")

const account = privateKeyToAccount(`0x${privateKey}`)
const recipient = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik.eth
const nexusClient = await createNexusClient({
  holder: account,
  chain,
  transport: http(),
  bundlerTransport: http(bundlerUrl),
  k1ValidatorAddress,
  factoryAddress
})

const main = async () => {
  console.log(
    "Your smart account will be deployed at address, make sure it has some funds to pay for user ops: ",
    await nexusClient.account.getAddress()
  )

  const hash = await nexusClient.sendTransaction({
    calls: [
      {
        to: recipient,
        value: parseEther("0.0001")
      }
    ]
  })

  const receipt = await (
    nexusClient.account.client as PublicClient
  ).waitForTransactionReceipt({ hash })
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
