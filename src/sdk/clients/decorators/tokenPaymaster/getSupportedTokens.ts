import { FeeQuote } from "./getTokenPaymasterQuotes"
import { NexusClient } from "../../createNexusClient"
import { BicoPaymasterClient } from "../../createBicoPaymasterClient"

export const getSupportedTokens = async (client: NexusClient): Promise<FeeQuote[]> => {
    const userOp = await client.prepareUserOperation({
        calls: [
            {
                to: client.account.address,
                data: "0x"
            }
        ]
    })
    const paymaster = client.paymaster as BicoPaymasterClient;
    const quote = await paymaster.getTokenPaymasterQuotes(userOp, [])

    return quote.feeQuotes
}
