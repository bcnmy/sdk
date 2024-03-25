import type { Chain, ClientConfig, Transport } from "viem"
import type { Prettify } from "viem/chains"
import type { Middleware, SmartAccount } from "../../accounts/utils/types"

export type SmartAccountClientConfig<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartAccount | undefined = SmartAccount | undefined
> = Prettify<
  Pick<
    ClientConfig<transport, chain, account>,
    "cacheTime" | "chain" | "key" | "name" | "pollingInterval"
  > &
    Middleware & {
      account: account
      bundlerTransport: Transport
    }
>
