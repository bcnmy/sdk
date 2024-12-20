import type {
  Abi,
  Chain,
  Client,
  ContractFunctionArgs,
  ContractFunctionName,
  Hash,
  Transport,
  TypedData,
  WaitForTransactionReceiptParameters,
  WaitForTransactionReceiptReturnType,
  WriteContractParameters
} from "viem"
import type {
  SmartAccount,
  UserOperation,
  WaitForUserOperationReceiptReturnType
} from "viem/account-abstraction"
import type { AnyData } from "../../../modules/utils/Types"
import {
  type PrepareTokenPaymasterUserOpParameters,
  prepareTokenPaymasterUserOp
} from "./prepareTokenPaymasterUserOp"
import {
  type SendTokenPaymasterUserOpParameters,
  sendTokenPaymasterUserOp
} from "./sendTokenPaymasterUserOp"
import { sendTransaction } from "./sendTransaction"
import { signMessage } from "./signMessage"
import { signTypedData } from "./signTypedData"
import { waitForTransactionReceipt } from "./waitForTransactionReceipt"
import { writeContract } from "./writeContract"

export type SmartAccountActions<
  TChain extends Chain | undefined = Chain | undefined,
  TSmartAccount extends SmartAccount | undefined = SmartAccount | undefined
> = {
  /**
   * Prepares and sends a user operation with token paymaster
   *
   * @param client - The Nexus client instance
   * @param args - The parameters for the token paymaster user operation
   * @param args.calls - Array of transactions to be executed
   * @param args.feeTokenAddress - Address of the token to be used for paying gas fees
   * @param args.customApprovalAmount - Optional custom amount to approve for the paymaster (defaults to unlimited)
   *
   * @example
   * ```ts
   * const receipt = await sendTokenPaymasterUserOp(client, {
   *   calls: [{
   *     to: "0x...", // Contract address
   *     data: "0x...", // Encoded function data
   *     value: BigInt(0)
   *   }],
   *   feeTokenAddress: "0x...", // USDC/USDT/etc address
   *   customApprovalAmount: BigInt(1000) // Optional: specific approval amount
   * })
   * ```
   *
   * @returns A promise that resolves to the user operation receipt {@link WaitForUserOperationReceiptReturnType}
   */
  sendTokenPaymasterUserOp: (
    args: SendTokenPaymasterUserOpParameters
  ) => Promise<WaitForUserOperationReceiptReturnType>
  /**
   * Prepares a user operation with token paymaster configuration, including ERC20 token approval
   *
   * This function handles:
   * 1. Checking current token allowance of Smart Account
   * 2. Creating an approval transaction for the token paymaster if needed
   * 3. Preparing the user operation with the approval and user transactions
   *
   * @param client - The NexusClient instance
   * @param args.txs - Array of transactions to be executed
   * @param args.feeTokenAddress - Token used for paying for the gas
   * @param args.customApprovalAmount - Optional custom approval amount
   *
   * @returns A prepared user operation without signature (will be signed by the Smart Account when sent)
   *
   * @example
   * ```typescript
   * const userOp = await prepareTokenPaymasterUserOp(nexusClient, {
   *    txs: [
   *      {
   *        to: recipientAddress,
   *        value: 1n,
   *        data: "0x"
   *      }
   *    ],
   *    feeTokenAddress: baseSepoliaUSDCAddress,
   *    customApprovalAmount: usdcFeeAmount
   *  })
   * ```
   *
   * @throws Will throw an error if client account or paymaster context is not properly configured
   */
  prepareTokenPaymasterUserOp: (
    args: PrepareTokenPaymasterUserOpParameters
  ) => Promise<Omit<UserOperation, "signature">>
  /**
   * Creates, signs, and sends a new transaction to the network using a smart account.
   * This function also allows you to sponsor this transaction if the sender is a smart account.
   *
   * @param client - The client instance.
   * @param args - Parameters for sending the transaction or user operation.
   * @param customApprovalAmount - The amount to approve for the Biconomy Token Paymaster to be spent on gas.
   * @returns The transaction hash as a hexadecimal string.
   * @throws {AccountNotFoundError} If the account is not found.
   *
   * @example
   * import { sendTransaction } from '@biconomy/sdk'
   *
   * const hash = await nexusClient.sendTransaction({calls: [{to: '0x...', value: parseEther('0.1'), data: '0x...'}]})
   * console.log(hash) // '0x...'
   */
  sendTransaction: <
    TChainOverride extends Chain | undefined = undefined,
    accountOverride extends SmartAccount | undefined = undefined,
    calls extends readonly unknown[] = readonly unknown[]
  >(
    args: Parameters<
      typeof sendTransaction<
        TSmartAccount,
        TChain,
        accountOverride,
        TChainOverride,
        calls
      >
    >[1]
  ) => Promise<Hash>

  /**
   * Calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.
   *
   * - Docs: https://viem.sh/docs/actions/wallet/signMessage.html
   * - JSON-RPC Methods:
   *   - JSON-RPC Accounts: [`personal_sign`](https://docs.metamask.io/guide/signing-data.html#personal-sign)
   *   - Local Accounts: Signs locally. No JSON-RPC request.
   *
   * With the calculated signature, you can:
   * - use [`verifyMessage`](https://viem.sh/docs/utilities/verifyMessage.html) to verify the signature,
   * - use [`recoverMessageAddress`](https://viem.sh/docs/utilities/recoverMessageAddress.html) to recover the signing address from a signature.
   *
   * @param args - {@link SignMessageParameters}
   * @returns The signed message. {@link SignMessageReturnType}
   *
   * @example
   * import { createWalletClient, custom } from 'viem'
   * import { mainnet } from 'viem/chains'
   *
   * const client = createWalletClient({
   *   chain: mainnet,
   *   transport: custom(window.ethereum),
   * })
   * const signature = await client.signMessage({
   *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
   *   message: 'hello world',
   * })
   *
   * @example
   * // Account Hoisting
   * import { createWalletClient, http } from 'viem'
   * import { privateKeyToAccount } from 'viem/accounts'
   * import { mainnet } from 'viem/chains'
   *
   * const client = createWalletClient({
   *   account: privateKeyToAccount('0x…'),
   *   chain: mainnet,
   *   transport: http(),
   * })
   * const signature = await client.signMessage({
   *   message: 'hello world',
   * })
   */
  signMessage: (
    args: Parameters<typeof signMessage<TSmartAccount>>[1]
  ) => ReturnType<typeof signMessage<TSmartAccount>>
  /**
   * Signs typed data and calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.
   *
   * - Docs: https://viem.sh/docs/actions/wallet/signTypedData.html
   * - JSON-RPC Methods:
   *   - JSON-RPC Accounts: [`eth_signTypedData_v4`](https://docs.metamask.io/guide/signing-data.html#signtypeddata-v4)
   *   - Local Accounts: Signs locally. No JSON-RPC request.
   *
   * @param client - Client to use
   * @param args - {@link SignTypedDataParameters}
   * @returns The signed data. {@link SignTypedDataReturnType}
   *
   * @example
   * import { createWalletClient, custom } from 'viem'
   * import { mainnet } from 'viem/chains'
   *
   * const client = createWalletClient({
   *   chain: mainnet,
   *   transport: custom(window.ethereum),
   * })
   * const signature = await client.signTypedData({
   *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
   *   domain: {
   *     name: 'Ether Mail',
   *     version: '1',
   *     chainId: 1,
   *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
   *   },
   *   types: {
   *     Person: [
   *       { name: 'name', type: 'string' },
   *       { name: 'wallet', type: 'address' },
   *     ],
   *     Mail: [
   *       { name: 'from', type: 'Person' },
   *       { name: 'to', type: 'Person' },
   *       { name: 'contents', type: 'string' },
   *     ],
   *   },
   *   primaryType: 'Mail',
   *   message: {
   *     from: {
   *       name: 'Cow',
   *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
   *     },
   *     to: {
   *       name: 'Bob',
   *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
   *     },
   *     contents: 'Hello, Bob!',
   *   },
   * })
   *
   * @example
   * // Account Hoisting
   * import { createWalletClient, http } from 'viem'
   * import { privateKeyToAccount } from 'viem/accounts'
   * import { mainnet } from 'viem/chains'
   *
   * const client = createWalletClient({
   *   account: privateKeyToAccount('0x…'),
   *   chain: mainnet,
   *   transport: http(),
   * })
   * const signature = await client.signTypedData({
   *   domain: {
   *     name: 'Ether Mail',
   *     version: '1',
   *     chainId: 1,
   *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
   *   },
   *   types: {
   *     Person: [
   *       { name: 'name', type: 'string' },
   *       { name: 'wallet', type: 'address' },
   *     ],
   *     Mail: [
   *       { name: 'from', type: 'Person' },
   *       { name: 'to', type: 'Person' },
   *       { name: 'contents', type: 'string' },
   *     ],
   *   },
   *   primaryType: 'Mail',
   *   message: {
   *     from: {
   *       name: 'Cow',
   *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
   *     },
   *     to: {
   *       name: 'Bob',
   *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
   *     },
   *     contents: 'Hello, Bob!',
   *   },
   * })
   */
  signTypedData: <
    const TTypedData extends TypedData | { [key: string]: unknown },
    TPrimaryType extends string
  >(
    args: Parameters<
      typeof signTypedData<TTypedData, TPrimaryType, TSmartAccount>
    >[1]
  ) => ReturnType<typeof signTypedData<TTypedData, TPrimaryType, TSmartAccount>>
  /**
   * Executes a write function on a contract.
   * This function also allows you to sponsor this transaction if sender is a smartAccount
   *
   * - Docs: https://viem.sh/docs/contract/writeContract.html
   * - Examples: https://stackblitz.com/github/wagmi-dev/viem/tree/main/examples/contracts/writing-to-contracts
   *
   * A "write" function on a Solidity contract modifies the state of the blockchain. These types of functions require gas to be executed, and hence a [Transaction](https://viem.sh/docs/glossary/terms.html) is needed to be broadcast in order to change the state.
   *
   * Internally, uses a [Wallet Client](https://viem.sh/docs/clients/wallet.html) to call the [`sendTransaction` action](https://viem.sh/nexus-client/methods#sendtransaction.html) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData.html).
   *
   * __Warning: The `write` internally sends a transaction – it does not validate if the contract write will succeed (the contract may throw an error). It is highly recommended to [simulate the contract write with `contract.simulate`](https://viem.sh/docs/contract/writeContract.html#usage) before you execute it.__
   *
   * @param args - {@link WriteContractParameters}
   * @returns A [Transaction Hash](https://viem.sh/docs/glossary/terms.html#hash). {@link WriteContractReturnType}
   *
   * @example
   * import { createWalletClient, custom, parseAbi } from 'viem'
   * import { mainnet } from 'viem/chains'
   *
   * const client = createWalletClient({
   *   chain: mainnet,
   *   transport: custom(window.ethereum),
   * })
   * const hash = await client.writeContract({
   *   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
   *   abi: parseAbi(['function mint(uint32 tokenId) nonpayable']),
   *   functionName: 'mint',
   *   args: [69420],
   * })
   *
   * @example
   * // With Validation
   * import { createWalletClient, custom, parseAbi } from 'viem'
   * import { mainnet } from 'viem/chains'
   *
   * const client = createWalletClient({
   *   chain: mainnet,
   *   transport: custom(window.ethereum),
   * })
   * const { request } = await client.simulateContract({
   *   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
   *   abi: parseAbi(['function mint(uint32 tokenId) nonpayable']),
   *   functionName: 'mint',
   *   args: [69420],
   * }
   * const hash = await client.writeContract(request)
   */
  writeContract: <
    const TAbi extends Abi | readonly unknown[],
    TFunctionName extends ContractFunctionName<
      TAbi,
      "nonpayable" | "payable"
    > = ContractFunctionName<TAbi, "nonpayable" | "payable">,
    TArgs extends ContractFunctionArgs<
      TAbi,
      "nonpayable" | "payable",
      TFunctionName
    > = ContractFunctionArgs<TAbi, "nonpayable" | "payable", TFunctionName>,
    TChainOverride extends Chain | undefined = undefined
  >(
    args: WriteContractParameters<
      TAbi,
      TFunctionName,
      TArgs,
      TChain,
      TSmartAccount,
      TChainOverride
    >
  ) => ReturnType<
    typeof writeContract<
      TChain,
      TSmartAccount,
      TAbi,
      TFunctionName,
      TArgs,
      TChainOverride
    >
  >
  waitForTransactionReceipt: (
    params: WaitForTransactionReceiptParameters
  ) => Promise<WaitForTransactionReceiptReturnType>
}

export function smartAccountActions() {
  return <
    TChain extends Chain | undefined = Chain | undefined,
    TSmartAccount extends SmartAccount | undefined = SmartAccount | undefined
  >(
    client: Client<Transport, TChain, TSmartAccount>
  ): SmartAccountActions<TChain, TSmartAccount> => ({
    sendTokenPaymasterUserOp: (args) => sendTokenPaymasterUserOp(client, args),
    prepareTokenPaymasterUserOp: (args) =>
      prepareTokenPaymasterUserOp(client, args),
    sendTransaction: (args) => sendTransaction(client, args as AnyData),
    signMessage: (args) => signMessage(client, args),
    signTypedData: (args) => signTypedData(client, args),
    writeContract: (args) => writeContract(client, args),
    waitForTransactionReceipt: (args) => waitForTransactionReceipt(client, args)
  })
}
