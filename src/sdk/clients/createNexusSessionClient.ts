import type { Address } from "viem"
import { smartSessionUseActions } from "../modules/smartSessions/decorators"
import { type NexusClientConfig, createNexusClient } from "./createNexusClient"

export type NexusSessionClientConfig = NexusClientConfig & {
  accountAddress: Address
}
export const createNexusSessionClient = async (
  parameters: NexusSessionClientConfig
) =>
  (await createNexusClient({ ...parameters })).extend(smartSessionUseActions())
