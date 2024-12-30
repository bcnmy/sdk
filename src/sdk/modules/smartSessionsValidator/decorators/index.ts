import type { Chain, Client, Hash, Transport } from "viem"
import type { ModularSmartAccount, Module } from "../../utils/Types"
import type { GrantPermissionAdvancedResponse } from "../Types"
import type { SmartSessionModule } from "../toSmartSessionsValidator"
import {
  type GrantPermissionParameters,
  grantPermission
} from "./grantPermission.js"
import {
  type GrantPermissionAdvancedParameters,
  grantPermissionAdvanced
} from "./grantPermissionAdvanced.js"
import {
  type PreparePermissionParameters,
  type PreparePermissionResponse,
  preparePermission
} from "./preparePermission.js"
import { type TrustAttestersParameters, trustAttesters } from "./trustAttesters"
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
   * This differs from grantPermissionAdvanced in that it defers the moment that the permission is granted
   * on chain to the moment that the redemption user operation is sent/redeemed. It is also known as "ENABLE_MODE".
   * It is the default mode for the grantPermission function.
   *
   * @param args - Parameters for creating sessions.
   * @returns A promise that resolves to the creation response.
   */
  grantPermission: (
    args: GrantPermissionParameters<TModularSmartAccount>
  ) => Promise<PreparePermissionResponse>
  /**
   * Creates multiple sessions for a modular smart account. This differs from grantPermission in that it
   * grants the permission on chain immediately. It is also known as "USE_MODE", and it means that the permission
   * is granted on chain immediately, and the permission is later redeemed when the user operation is sent.
   *
   * @param args - Parameters for creating sessions.
   * @returns A promise that resolves to the creation response.
   */
  grantPermissionAdvanced: (
    args: GrantPermissionAdvancedParameters<TModularSmartAccount>
  ) => Promise<GrantPermissionAdvancedResponse>

  /**
   * Trusts attesters for a modular smart account.
   *
   * @param args - Parameters for trusting attesters.
   * @returns A promise that resolves to the transaction hash.
   */
  trustAttesters: (
    args?: TrustAttestersParameters<TModularSmartAccount>
  ) => Promise<Hash>
  /**
   * Prepares permission for a modular smart account.
   *
   * @param args - Parameters for preparing permission.
   * @returns A promise that resolves to the transaction hash.
   */
  preparePermission: (
    args: PreparePermissionParameters<TModularSmartAccount>
  ) => Promise<PreparePermissionResponse>
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
      grantPermissionAdvanced: (args) => grantPermissionAdvanced(client, args),
      trustAttesters: (args) => trustAttesters(client, args),
      preparePermission: (args) => preparePermission(client, args)
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
      usePermission: (args) => usePermission(client, args)
    }
  }
}

export * from "./grantPermission"
export * from "./trustAttesters"
export * from "./usePermission"
export * from "./grantPermissionAdvanced"
