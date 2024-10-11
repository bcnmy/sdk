import type { Chain, Client, Hash, Transport } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { activateModule } from "../../activateModule"
import type { CreateSessionsResponse, SmartSessionMetaData } from "../Types"
import { type CreateSessionsParameters, createSessions } from "./createSessions"
import { type UseSessionParameters, useSession } from "./useSession"

export type SmartSessionValidatorActions<
  TSmartAccount extends SmartAccount | undefined
> = {
  createSessions: (
    args: CreateSessionsParameters<TSmartAccount>
  ) => Promise<CreateSessionsResponse>
  useSession: (
    args: UseSessionParameters<TSmartAccount> & { data: SmartSessionMetaData }
  ) => Promise<Hash>
}

export function smartSessionValidatorActions() {
  return <TSmartAccount extends SmartAccount | undefined>(
    client: Client<Transport, Chain | undefined, TSmartAccount>
  ): SmartSessionValidatorActions<TSmartAccount> => {
    return {
      createSessions: (args) => {
        // activateModule(client, "smartSession")
        return createSessions(client, args)
      },
      useSession: ({ data, ...rest }) => {
        activateModule(client, "smartSession", data)
        return useSession(client, rest as UseSessionParameters<TSmartAccount>)
      }
    }
  }
}

export type { CreateSessionsParameters }

export { createSessions }
