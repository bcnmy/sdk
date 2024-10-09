import {
  http,
  type Account,
  type Address,
  type Chain,
  type Client,
  type ClientConfig,
  type EstimateFeesPerGasReturnType,
  type Hex,
  type Prettify,
  type RpcSchema,
  type Transport,
  createWalletClient,
  encodePacked
} from "viem"
import type {
  PaymasterActions,
  SmartAccount,
  UserOperationRequest
} from "viem/account-abstraction"
import type { Call } from "../account/utils/Types"

import type { UnknownSigner } from "../account/utils/toSigner"
import { toSmartSessionValidatorModule } from "../modules/validators/smartSessionValidator/tosmartSessionValidatorModule"
import type { ToValidationModuleReturnType } from "../modules/validators/toValidationModule"
import { type NexusClient, createNexusClient } from "./createNexusClient"

// Review: Marked for removal.
/**
 * Parameters for sending a transaction
 */
export type SendTransactionParameters = {
  calls: Call | Call[]
}
// UseSessionParameters

/**
 * Configuration for creating a Session Nexus Client
 */
// Review: Could create our own type with only things needed for session client.
export type NexusSessionClientConfig<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends SmartAccount | undefined = SmartAccount | undefined,
  client extends Client | undefined = Client | undefined,
  rpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Pick<
    ClientConfig<transport, chain, account, rpcSchema>,
    | "account"
    | "cacheTime"
    | "chain"
    | "key"
    | "name"
    | "pollingInterval"
    | "rpcSchema"
  > & {
    /** RPC URL. */
    transport: transport
    /** Bundler URL. */
    bundlerTransport: transport
    /** Client that points to an Execution RPC URL. */
    client?: client | Client | undefined
    /** Paymaster configuration. */
    paymaster?:
    | true
    | {
      /** Retrieves paymaster-related User Operation properties to be used for sending the User Operation. */
      getPaymasterData?: PaymasterActions["getPaymasterData"] | undefined
      /** Retrieves paymaster-related User Operation properties to be used for gas estimation. */
      getPaymasterStubData?:
      | PaymasterActions["getPaymasterStubData"]
      | undefined
    }
    | undefined
    /** Paymaster context to pass to `getPaymasterData` and `getPaymasterStubData` calls. */
    paymasterContext?: unknown
    /** User Operation configuration. */
    userOperation?:
    | {
      /** Prepares fee properties for the User Operation request. */
      estimateFeesPerGas?:
      | ((parameters: {
        account: account | SmartAccount
        bundlerClient: Client
        userOperation: UserOperationRequest
      }) => Promise<EstimateFeesPerGasReturnType<"eip1559">>)
      | undefined
    }
    | undefined
    /** Owner of the session. */
    signer: UnknownSigner
    /** Index of the account. */
    index?: bigint
    /** Active module of the account. */
    activeModule?: ToValidationModuleReturnType
    /** Factory address of the account. */
    factoryAddress?: Address
    /** Address of the account. */
    accountAddress: Address
    //  @note Review. Since we are passing a signer (session owner) we can get the address from there.
    // /** Session key EOA */
    // sessionKeyEOA: Address
    /** Permission ID */
    permissionId: Hex

    // Note: maybe someone can just supply bundlerTransport from outside so this is not needed.
    /** Bundler URL */
    bundlerUrl: string

    /** Owner module */
    k1ValidatorAddress?: Address
  }
>

// TODO: write natspecs
// Basically..
// This is used to impersonate a users smart account by a dapp, for use with a valid session that has previously been granted by the user.
// A dummy signer is passed into the smart account instance, which cannot be used.
// The sessionSigner is used instead for signing transactions
/**
 *
 * @param parameters
 * @returns
 */
export async function createNexusSessionClient(
  parameters: NexusSessionClientConfig
): Promise<NexusClient> {
  // Note: I only need these if I was ever to do toNexusAccount here.
  const {
    client: client_,
    chain = parameters.chain ?? client_?.chain,
    signer,
    accountAddress,
    bundlerUrl,
    permissionId,
  } = parameters

  if (!chain) throw new Error("Missing chain")

  const sessionClient = createWalletClient({
    account: signer as Account,
    chain,
    transport: http()
  })

  if (!signer.address) throw new Error("Invalid signer")
  // Review: review supplying a session signer.
  const smartSessionValidator = await toSmartSessionValidatorModule({
    client: sessionClient,
    initData: encodePacked(["address"], [signer?.address ?? "0x"]),
    deInitData: "0x",
    nexusAccountAddress: accountAddress,
    // Review: supply of permissionId when initialising module.
    activePermissionId: permissionId
  })

  const nexusClient = await createNexusClient({
    signer: sessionClient.account, // session signer should be able to sign for SA at accountAddress
    activeModule: smartSessionValidator,
    chain,
    transport: http(),
    bundlerTransport: http(bundlerUrl),
    accountAddress
  })
  return nexusClient
}
