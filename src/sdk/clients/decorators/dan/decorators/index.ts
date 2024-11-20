import type { Chain, Client, Transport } from "viem"
import type { UserOperation } from "viem/account-abstraction"
import type { ModularSmartAccount } from "../../../../modules/utils/Types"
import { type KeyGenData, type KeyGenParameters, keyGen } from "./keyGen"
import { type SigGenParameters, sigGen } from "./sigGen"

/**
 * Defines the available DAN (Distributed Account Network) actions for a modular smart account.
 * Provides methods for key generation, signature generation, and transaction sending.
 *
 * @template TModularSmartAccount - The type of modular smart account being used
 */
export type DanActions<
  TModularSmartAccount extends ModularSmartAccount | undefined
> = {
  /** Generates keys for the smart account with optional parameters */
  keyGen: (args?: KeyGenParameters<TModularSmartAccount>) => Promise<KeyGenData>
  /** Generates signatures for user operations */
  /** Generates signatures for user operations */
  sigGen: (parameters: SigGenParameters) => Promise<Partial<UserOperation>>
}

/**
 * Creates a set of DAN-specific actions for interacting with a modular smart account.
 * This function is a decorator that adds DAN functionality to a viem Client instance.
 *
 * @returns A function that takes a client and returns DAN-specific actions
 *
 * @example
 * const client = createClient(...)
 * const danClient = client.extend(danActions())
 */
export function danActions() {
  return <
    TModularSmartAccount extends ModularSmartAccount | undefined,
    chain extends Chain | undefined
  >(
    client: Client<Transport, chain, TModularSmartAccount>
  ): DanActions<TModularSmartAccount> => ({
    keyGen: (args) => keyGen(client, args),
    sigGen: (parameters) => sigGen(client, parameters)
  })
}
