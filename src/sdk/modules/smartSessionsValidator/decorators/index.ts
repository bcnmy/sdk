import type { Chain, Client, Hash, Transport } from "viem"
import { danActions } from "../../../clients/decorators/dan/decorators"
import type { ModularSmartAccount, Module } from "../../utils/Types"
import type { GrantPermissionResponse } from "../Types"
import type { SmartSessionModule } from "../toSmartSessionsValidator"
import {
  type GrantPermissionParameters,
  grantPermission
} from "./grantPermission"
import { type TrustAttestersParameters, trustAttesters } from "./trustAttesters"
import {
  type DanClient,
  type UseDistributedPermissionParameters,
  useDistributedPermission
} from "./useDistributedPermission"
import { type UsePermissionParameters, usePermission } from "./usePermission"
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
  grantPermission: (
    args: GrantPermissionParameters<TModularSmartAccount>
  ) => Promise<GrantPermissionResponse>

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
  usePermission: (
    args: UsePermissionParameters<TModularSmartAccount>
  ) => Promise<Hash>
  /**
   * Uses a session to perform multiple actions.
   *
   * @param args - Parameters for using a session.
   * @returns A promise that resolves to the transaction hash.
   */
  useDistributedPermission: (
    args: UseDistributedPermissionParameters<TModularSmartAccount>
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
      grantPermission: (args) => grantPermission(client, args),
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
export function smartSessionUseActions(
  smartSessionsModule: SmartSessionModule
) {
  return <TModularSmartAccount extends ModularSmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TModularSmartAccount>
  ): SmartSessionUseActions<TModularSmartAccount> => {
    client?.account?.setModule(smartSessionsModule)
    return {
      usePermission: (args) => usePermission(client, args),
      useDistributedPermission: (args) => {
        const danClient = client.extend(danActions()) as unknown as DanClient
        return useDistributedPermission(danClient, args)
      }
    }
  }
}

export * from "./grantPermission"
export * from "./trustAttesters"
export * from "./usePermission"
export * from "./useDistributedPermission"
