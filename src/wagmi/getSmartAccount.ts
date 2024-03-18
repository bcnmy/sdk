import {
    type SmartAccountSigner,
} from "permissionless/accounts"
import type { Address, Chain, PublicClient, Transport } from "viem"
import { type SmartAccount, type UserOperation } from "../accounts/utils/types"
import { smartAccount } from "./smartAccountConnector"
import { signerToSmartAccount } from "../accounts"
import { createSmartAccountClient } from "../client"

export type SponsorUserOperationMiddleware = {
    sponsorUserOperation?: (args: {
        userOperation: UserOperation
        entryPoint: Address
    }) => Promise<UserOperation>
}

export type SmartAccountParameters<
TTransport extends Transport = Transport,   
TChain extends Chain | undefined = Chain | undefined,
TSource extends string = string,
TAddress extends Address = Address> = {
    publicClient: PublicClient<TTransport, TChain>
    signer: SmartAccountSigner<TSource, TAddress>
    bundlerTransport: TTransport
} & SponsorUserOperationMiddleware

export async function smartAccountConnectorHelper({
    bundlerTransport,
    account,
}: {bundlerTransport: Transport, account: SmartAccount}) {
    const smartAccountClient = createSmartAccountClient({
        account,
        bundlerTransport: bundlerTransport,
    })

    return smartAccount({
        smartAccountClient: smartAccountClient
    })
}

export async function getSmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address
>({
    publicClient,
    signer,
    bundlerTransport,
    sponsorUserOperation,
    ...rest
}: SmartAccountParameters<TTransport, TChain, TSource, TAddress>) {
    return smartAccountConnectorHelper({
        account: await signerToSmartAccount(publicClient, {
            ...rest,
            signer
        }),
        bundlerTransport,
    })
}
