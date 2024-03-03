import { http, createPublicClient } from "viem"
import { getNonce } from "../common/index.js"
import {
  ACCOUNT_V2_0_LOGIC,
  DEFAULT_BICONOMY_FACTORY_ADDRESS,
  DEFAULT_ECDSA_OWNERSHIP_MODULE
} from "../common/utils/constants.js"
import { extractChainIdFromBundlerUrl } from "../common/utils/helpers.js"
import { getAccountAddress } from "./actions/getAccountAddress.js"
import { validateConfig } from "./utils/helpers.js"
import type { BiconomySmartAccountConfig } from "./utils/types.js"

export const DEFAULT_FALLBACK_HANDLER_ADDRESS =
  "0x0bBa6d96BD616BedC6BFaa341742FD43c60b83C1"

export const createBiconomySmartAccount = async (
  config: BiconomySmartAccountConfig
) => {
  validateConfig(config)
  if (!config.walletClient.account?.address) {
    throw new Error("No account address")
  }

  const chainId = await config.walletClient.getChainId()

  // Signer needs to be initialised here before defaultValidationModule is set
  if (config.walletClient) {
    if (!chainId && !!config.walletClient.chain?.id) {
      let chainIdFromBundler: number | undefined
      if (config.bundlerUrl) {
        chainIdFromBundler = extractChainIdFromBundlerUrl(config.bundlerUrl)
      }
      if (chainIdFromBundler !== chainId) {
        throw new Error("ChainId from bundler and signer do not match")
      }
    }
  }
  if (!chainId) {
    throw new Error("chainId required in clients")
  }

  const publicClient = createPublicClient({
    transport: http(config.walletClient.transport.url)
  })
  const account = config.walletClient.account

  const accountAddress = await getAccountAddress({
    owner: config.walletClient.account?.address,
    ecdsaModuleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
    factoryAddress: DEFAULT_BICONOMY_FACTORY_ADDRESS,
    accountLogicAddress: ACCOUNT_V2_0_LOGIC,
    fallbackHandlerAddress: DEFAULT_FALLBACK_HANDLER_ADDRESS,
    index: config.accountIndex ? BigInt(config.accountIndex) : 0n
  })

  return {
    ...account,
    client: publicClient,
    publicKey: config.walletClient.account?.address,
    entryPoint: "",
    source: "SimpleSmartAccount",
    async getNonce() {
      return getNonce(publicClient, accountAddress)
    },
    async getAccountAddress() {
      if (!config.walletClient.account?.address) {
        throw new Error("No account")
      }
      return getAccountAddress({
        owner: config.walletClient.account?.address,
        ecdsaModuleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
        factoryAddress: DEFAULT_BICONOMY_FACTORY_ADDRESS,
        accountLogicAddress: ACCOUNT_V2_0_LOGIC,
        fallbackHandlerAddress: DEFAULT_FALLBACK_HANDLER_ADDRESS,
        index: config.accountIndex ? BigInt(config.accountIndex) : 0n
      })
    }
    // async signUserOperation(userOperation) {
    //     return account.signMessage({
    //         message: {
    //             raw: getUserOperationHash({
    //                 userOperation,
    //                 entryPoint: entryPointAddress,
    //                 chainId: chainId
    //             })
    //         }
    //     })
    // },
    // async getInitCode() {
    //     if (smartAccountDeployed) return "0x"

    //     smartAccountDeployed = await isSmartAccountDeployed(
    //         client,
    //         accountAddress
    //     )

    //     if (smartAccountDeployed) return "0x"

    //     return concatHex([
    //         factoryAddress,
    //         await getAccountInitCode(viemSigner.address, index)
    //     ])
    // },
    // async getFactory() {
    //     if (smartAccountDeployed) return undefined
    //     smartAccountDeployed = await isSmartAccountDeployed(
    //         client,
    //         accountAddress
    //     )
    //     if (smartAccountDeployed) return undefined
    //     return factoryAddress
    // },
    // async getFactoryData() {
    //     if (smartAccountDeployed) return undefined
    //     smartAccountDeployed = await isSmartAccountDeployed(
    //         client,
    //         accountAddress
    //     )
    //     if (smartAccountDeployed) return undefined
    //     return getAccountInitCode(viemSigner.address, index)
    // },
    // async encodeDeployCallData(_) {
    //     throw new Error("Simple account doesn't support account deployment")
    // },
    // async encodeCallData(args) {
    //     if (Array.isArray(args)) {
    //         const argsArray = args as {
    //             to: Address
    //             value: bigint
    //             data: Hex
    //         }[]

    //         if (getEntryPointVersion(entryPointAddress) === "v0.6") {
    //             return encodeFunctionData({
    //                 abi: [
    //                     {
    //                         inputs: [
    //                             {
    //                                 internalType: "address[]",
    //                                 name: "dest",
    //                                 type: "address[]"
    //                             },
    //                             {
    //                                 internalType: "bytes[]",
    //                                 name: "func",
    //                                 type: "bytes[]"
    //                             }
    //                         ],
    //                         name: "executeBatch",
    //                         outputs: [],
    //                         stateMutability: "nonpayable",
    //                         type: "function"
    //                     }
    //                 ],
    //                 functionName: "executeBatch",
    //                 args: [
    //                     argsArray.map((a) => a.to),
    //                     argsArray.map((a) => a.data)
    //                 ]
    //             })
    //         }
    //         return encodeFunctionData({
    //             abi: [
    //                 {
    //                     inputs: [
    //                         {
    //                             internalType: "address[]",
    //                             name: "dest",
    //                             type: "address[]"
    //                         },
    //                         {
    //                             internalType: "uint256[]",
    //                             name: "value",
    //                             type: "uint256[]"
    //                         },
    //                         {
    //                             internalType: "bytes[]",
    //                             name: "func",
    //                             type: "bytes[]"
    //                         }
    //                     ],
    //                     name: "executeBatch",
    //                     outputs: [],
    //                     stateMutability: "nonpayable",
    //                     type: "function"
    //                 }
    //             ],
    //             functionName: "executeBatch",
    //             args: [
    //                 argsArray.map((a) => a.to),
    //                 argsArray.map((a) => a.value),
    //                 argsArray.map((a) => a.data)
    //             ]
    //         })
    //     }

    //     const { to, value, data } = args as {
    //         to: Address
    //         value: bigint
    //         data: Hex
    //     }

    //     return encodeFunctionData({
    //         abi: [
    //             {
    //                 inputs: [
    //                     {
    //                         internalType: "address",
    //                         name: "dest",
    //                         type: "address"
    //                     },
    //                     {
    //                         internalType: "uint256",
    //                         name: "value",
    //                         type: "uint256"
    //                     },
    //                     {
    //                         internalType: "bytes",
    //                         name: "func",
    //                         type: "bytes"
    //                     }
    //                 ],
    //                 name: "execute",
    //                 outputs: [],
    //                 stateMutability: "nonpayable",
    //                 type: "function"
    //             }
    //         ],
    //         functionName: "execute",
    //         args: [to, value, data]
    //     })
    // },
    // async getDummySignature(_userOperation) {
    //     return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
    // }
  }
}
