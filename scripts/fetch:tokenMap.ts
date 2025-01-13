import fs from "node:fs"
import path from "node:path"
import { getAddress, isHex } from "viem"
import { baseSepolia } from "viem/chains"
import coinDataFromJson from "../.data/coinData.json"
import coinIdsFromJson from "../.data/coinIds.json"
import networkIdMap from "../.data/networkIdMap.json"

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function writeJsonToFile(data: any, filename: string) {
  // Create directory path if it doesn't exist
  const dirname = path.dirname(filename)
  fs.mkdirSync(dirname, { recursive: true })
  fs.writeFileSync(filename, JSON.stringify(data, null, 2))
}

async function writeTsToFile(data: string, filename: string) {
  // Create directory path if it doesn't exist
  const dirname = path.dirname(filename)
  fs.mkdirSync(dirname, { recursive: true })
  fs.writeFileSync(filename, data)
}

async function getErc20CoinsByMarketCap(limit = 200): Promise<string[]> {
  if (coinIdsFromJson.length > 0) return coinIdsFromJson

  const COINS_TO_OMIT_FROM_COIN_DATA = coinDataFromJson
    .map((coin) => coin?.id)
    .filter(Boolean)

  const COINS_TO_OMIT = ["ethereum", ...COINS_TO_OMIT_FROM_COIN_DATA]
  const fetchResponse = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=ethereum-ecosystem&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`,
    { method: "GET", headers: { accept: "application/json" } }
  )
  const coinResponse = await fetchResponse.json()
  const coinIds = coinResponse
    .filter((coin) => !COINS_TO_OMIT.includes(coin.id))
    .map((coin) => coin.id)
  writeJsonToFile(coinIds, path.join(__dirname, "../.data/coinIds.json"))
  return coinIds
}

type Coin = {
  id: string
  symbol: string
  name: string
  platforms: Record<string, string>
}
async function getCoinDataById(coinIds_: string[]): Promise<Coin[]> {
  const COINS_TO_OMIT = coinDataFromJson.map((coin) => coin?.id).filter(Boolean)
  const coinsToFetch = coinIds_.filter(
    (coinId) => !COINS_TO_OMIT.includes(coinId)
  )
  const coinsAlreadyFetched = coinDataFromJson.filter((coin) => coin?.id)

  const coinResponses = []
  // Run promises in sequence
  for (const coinId of coinsToFetch) {
    try {
      const coinResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}`,
        {
          method: "GET",
          headers: { accept: "application/json" }
        }
      )
      await new Promise((resolve) => setTimeout(resolve, 3000)) // Sleep for 3 seconds to avoid rate limiting
      // @ts-ignore
      coinResponses.push(await coinResponse.json())
    } catch (error) {
      // Likely rate limited. Skip this coin and continue
      console.error(`Error fetching coin data for ${coinId}:`, error)
    }
  }

  const coinData = coinResponses.map(({ id, symbol, name, platforms }) => ({
    id,
    symbol,
    name,
    platforms
  }))

  const newCoinData = [...coinsAlreadyFetched, ...coinData].filter(
    (v) => Object.keys(v ?? {}).length > 0
  )

  writeJsonToFile(newCoinData, path.join(__dirname, "../.data/coinData.json"))

  // @ts-ignore
  return newCoinData
}

type Networks = Record<string, number>
async function getNetworkIds(): Promise<Networks> {
  if (Object.keys(networkIdMap).length > 0) return networkIdMap
  const fetchResponse = await fetch(
    "https://api.coingecko.com/api/v3/asset_platforms",
    { method: "GET", headers: { accept: "application/json" } }
  )
  const networks = await fetchResponse.json()
  const newNetworkIdMap = networks.reduce((acc, network) => {
    const networkId = Number(network?.chain_identifier ?? 0)
    const networkName = network?.id
    if (!!networkId && !!networkName) {
      acc[networkName] = networkId
    }
    return acc
  }, {})
  writeJsonToFile(
    newNetworkIdMap,
    path.join(__dirname, "../.data/networkIdMap.json")
  )
  return newNetworkIdMap
}

type FinalisedCoin = {
  id: string
  symbol: string
  name: string
  networks: Record<string, string>
}

function sanitiseCoins(networks: Networks, coinData: Coin[]): FinalisedCoin[] {
  const HARDCODE = {
    usdc: {
      [baseSepolia.id]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    }
  }

  // @ts-ignore
  return coinData
    .filter(Boolean)
    .map(({ id, symbol, name, platforms }) => {
      const networkNames = Object.keys(platforms ?? {})
      const sanitisedNetworks = networkNames.reduce(
        (acc, platform) => {
          const networkId = networks[platform]
          const address = platforms[platform]
          if (networkId && isHex(address)) acc[networkId] = getAddress(address)
          return acc
        },
        (HARDCODE[symbol] ?? {}) as Record<string, string>
      )

      if (
        !id ||
        !symbol ||
        !name ||
        !platforms ||
        Object.keys(sanitisedNetworks ?? {}).length <= 1
      ) {
        return undefined
      }
      return {
        id,
        symbol,
        name,
        networks: sanitisedNetworks
      }
    })
    .filter(Boolean)
}

async function generateTokenConstants(coins: FinalisedCoin[]) {
  const warning =
    "// N.B. This file is auto-generated by the fetch:tokenMap.ts script. Do not edit it manually. \n// Instead, edit the script and run it again, or hardcode your new tokens in the index file that imports this file"

  const startOfFile = `import { getMultichainContract } from "../../account/utils/getMultichainContract";\nimport { erc20Abi } from "viem"\n\n`

  const tokenConstants = coins
    .map((coin) => {
      const { symbol, networks } = coin

      const safeId = symbol
        .replace(/[^a-zA-Z0-9]/g, "_") // Replace any non-alphanumeric chars with underscore
        .replace(/^[0-9]/, "_$&") // If starts with number, prefix with underscore
        .toUpperCase()

      return `export const mc${safeId} = getMultichainContract<typeof erc20Abi>({
    abi: erc20Abi,
    deployments: [${Object.entries(networks)
      .map(([networkId, address]) => `['${address}', ${networkId}]`)
      .join(",\n    ")}]
  })`
    })
    .join("\n\n")

  writeTsToFile(
    `${warning}\n\n${startOfFile}\n\n${tokenConstants}`,
    path.join(__dirname, "../src/sdk/constants/tokens/__AUTO_GENERATED__.ts")
  )
}

async function main() {
  const coinIds = await getErc20CoinsByMarketCap(200)
  const coinData = await getCoinDataById(coinIds)
  console.log("coinData.length", coinData.length)

  const networks = await getNetworkIds()
  const coins = sanitiseCoins(networks, coinData)
  console.log("coins.length", coins.length)

  await writeJsonToFile(coins, path.join(__dirname, "../.data/coins.json"))

  await generateTokenConstants(coins)
}

main().catch((err) => console.error(err))
