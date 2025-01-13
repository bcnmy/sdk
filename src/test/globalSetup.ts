import { config } from "dotenv"
import {
  type NetworkConfig,
  type NetworkConfigWithBundler,
  initAnvilNetwork
} from "./testUtils"

config()

let globalConfig: NetworkConfigWithBundler
// @ts-ignore
export const setup = async ({ provide }) => {
  globalConfig = await initAnvilNetwork()
  const runPaidTests = process.env.RUN_PAID_TESTS?.toString() === "true"
  const { bundlerInstance, instance, ...serializeableConfig } = globalConfig
  provide("settings", { ...serializeableConfig, runPaidTests })
}

export const teardown = async () => {
  await Promise.all([
    globalConfig.instance.stop(),
    globalConfig.bundlerInstance.stop()
  ])
}

declare module "vitest" {
  export interface ProvidedContext {
    settings: NetworkConfig & { runPaidTests: boolean }
  }
}
