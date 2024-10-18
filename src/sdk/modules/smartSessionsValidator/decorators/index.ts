import type { Chain, Client, Hash, Transport } from "viem"
import type { ModularSmartAccount, Module } from "../../utils/Types"
import type { CreateSessionsResponse } from "../Types"
import { type CreateSessionsParameters, createSessions } from "./createSessions"
import { type TrustAttestersParameters, trustAttesters } from "./trustAttesters"
import { type UseSessionParameters, useSession } from "./useSession"

/**
 * Defines the shape of actions available for creating smart sessions.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 */
export type SmartSessionCreateActions<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /**
   * Creates multiple sessions for a modular smart account.
   *
   * @param args - Parameters for creating sessions.
   * @returns A promise that resolves to the creation response.
   */
  createSessions: (
    args: CreateSessionsParameters<TModularSmartAccount>
  ) => Promise<CreateSessionsResponse>

  /**
   * Trusts attesters for a modular smart account.
   *
   * @param args - Parameters for trusting attesters.
   * @returns A promise that resolves to the transaction hash.
   */
  trustAttesters: (
    args?: TrustAttestersParameters<TModularSmartAccount>
  ) => Promise<Hash>
}

/**
 * Defines the shape of actions available for using smart sessions.
 *
 * @template TModularSmartAccount - Type of the modular smart account, extending ModularSmartAccount or undefined.
 */
export type SmartSessionUseActions<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /**
   * Uses a session to perform an action.
   *
   * @param args - Parameters for using a session.
   * @returns A promise that resolves to the transaction hash.
   */
  useSession: (
    args: UseSessionParameters<TModularSmartAccount>
  ) => Promise<Hash>
}

/**
 * Creates actions for managing smart session creation.
 *
 * @param _ - Unused parameter (placeholder for potential future use).
 * @returns A function that takes a client and returns SmartSessionCreateActions.
 */
export function smartSessionCreateActions(_: Module) {
  return <TModularSmartAccount extends ModularSmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TModularSmartAccount>
  ): SmartSessionCreateActions<TModularSmartAccount> => {
    return {
      createSessions: (args) => createSessions(client, args),
      trustAttesters: (args) => trustAttesters(client, args)
    }
  }
}

/**
 * Creates actions for using smart sessions.
 *
 * @param smartSessionsModule - The smart sessions module to be set on the client's account.
 * @returns A function that takes a client and returns SmartSessionUseActions.
 */
export function smartSessionUseActions(smartSessionsModule: Module) {
  return <TModularSmartAccount extends ModularSmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TModularSmartAccount>
  ): SmartSessionUseActions<TModularSmartAccount> => {
    client?.account?.setModule(smartSessionsModule)
    return {
      useSession: (args) => useSession(client, args)
    }
  }
}

// Re-exporting types and functions for easier access
export type { CreateSessionsParameters, UseSessionParameters }
export { createSessions, useSession }
