import { SmartAccountClient, SmartAccountClientConfig } from "permissionless"
import {
  ENTRYPOINT_ADDRESS_V07_TYPE,
  EntryPoint
} from "permissionless/_types/types"

import { Chain, Transport, createClient } from "viem"

import { SmartAccount } from "../account/utils/types"

export function createSmartAccountClient<
  TSmartAccount extends SmartAccount<TEntryPoint> | undefined,
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = undefined,
  TEntryPoint extends EntryPoint = TSmartAccount extends SmartAccount<infer U>
    ? U
    : never
>(
  parameters: SmartAccountClientConfig<
    ENTRYPOINT_ADDRESS_V07_TYPE,
    Transport,
    Chain | undefined,
    SmartAccount | undefined
  >
): SmartAccountClient<TEntryPoint, TTransport, TChain, TSmartAccount> {
  const {
    key = "Account",
    name = "Biconomy Smart Account Client",
    bundlerTransport
  } = parameters

  const client = createClient({
    ...parameters,
    key,
    name,
    transport: bundlerTransport,
    type: "biconomySmartAccountClient"
  })

  return client as SmartAccountClient<
    TEntryPoint,
    TTransport,
    TChain,
    TSmartAccount
  >
}
