import {
  type Address,
  type Client,
  type Hex,
  type LocalAccount,
  type Transport,
  type TypedData,
  type TypedDataDefinition,
  concatHex,
  encodeFunctionData
} from "viem"
import { toAccount } from "viem/accounts"
import { getChainId, signMessage, signTypedData } from "viem/actions"

import {
  ACCOUNT_V2_0_LOGIC,
  BiconomyExecuteAbi,
  BiconomyFactoryAbi,
  BiconomyInitAbi,
  DEFAULT_BICONOMY_FACTORY_ADDRESS,
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
  DEFAULT_ENTRYPOINT_ADDRESS,
  type ENTRYPOINT_ADDRESS_V07_TYPE,
  type TChain,
  type UserOperationStruct,
  extractChainIdFromBundlerUrl,
  getNonce,
  isSmartAccountDeployed
} from "../common/index.js"

import {
  createECDSAOwnershipModule
} from "../modules/index.js"

import { getUserOperationHash, validateConfig } from "./utils/helpers.js"
import type { BiconomySmartAccountConfig, SmartAccount } from "./utils/types.js"

import { getAccountAddress } from "./actions/getAccountAddress.js"

export const DEFAULT_FALLBACK_HANDLER_ADDRESS =
  "0x0bBa6d96BD616BedC6BFaa341742FD43c60b83C1"

/**
 * Return the value to put into the "initCode" field, if the account is not yet deployed.
 * This value holds the "factory" address, followed by this account's information
 */
const getAccountInitCode = async ({
  owner,
  index,
  moduleAddress
}: {
  owner: Address
  index: bigint
  moduleAddress: Address
}): Promise<Hex> => {
  if (!owner) throw new Error("Owner account not found")

  // Build the module setup data
  const ecdsaOwnershipInitData = encodeFunctionData({
    abi: BiconomyInitAbi,
    functionName: "initForSmartAccount",
    args: [owner]
  })

  // Build the account init code
  return encodeFunctionData({
    abi: BiconomyFactoryAbi,
    functionName: "deployCounterFactualAccount",
    args: [moduleAddress, ecdsaOwnershipInitData, index]
  })
}

export const createBiconomySmartAccount = async (
  client: Client<Transport, TChain, undefined>,
  config: BiconomySmartAccountConfig
): Promise<
  SmartAccount<ENTRYPOINT_ADDRESS_V07_TYPE, "BiconomySmartAccountV3", Transport>
> => {
  // TODO* Add error handling and validation for config
  validateConfig(config)

  const chainId = await getChainId(client)

  // let activeValidationModule: BaseValidationModule | undefined

  let chainIdFromBundler: number | undefined
  if (config.bundlerUrl) {
    chainIdFromBundler = extractChainIdFromBundlerUrl(config.bundlerUrl)
  }
  if (chainIdFromBundler !== chainId) {
    throw new Error("ChainId from bundler and client do not match")
  }

  const viemSigner: LocalAccount = {
    ...config.signer,
    signTransaction: (_, __) => {
      throw new Error("signTransaction not supported by ERC4337 account")
    }
  } as LocalAccount

  // We set ECDSA as default module if no module is provided
  const defaultValidationModule =
    config.defaultValidationModule ??
    (await createECDSAOwnershipModule({
      signer: viemSigner
    }))
  // activeValidationModule =
  //   config.activeValidationModule ?? defaultValidationModule

  const accountAddress = await getAccountAddress({
    validationModule: defaultValidationModule,
    factoryAddress: config.factoryAddress ?? DEFAULT_BICONOMY_FACTORY_ADDRESS,
    accountLogicAddress: ACCOUNT_V2_0_LOGIC,
    fallbackHandlerAddress: DEFAULT_FALLBACK_HANDLER_ADDRESS,
    index: config.accountIndex ? BigInt(config.accountIndex) : 0n
  })

  if (!accountAddress) throw new Error("Account address not found")

  let smartAccountDeployed = await isSmartAccountDeployed(
    client,
    accountAddress
  )

  const account = toAccount({
    address: accountAddress,
    async signMessage({ message }) {
      // @ts-ignore // We check for walletClient.account in validateConfig
      return signMessage(config.walletClient, { account: viemSigner, message })
    },
    async signTransaction(_, __) {
      throw new Error("signTransaction not supported by ERC4337 account")
    },
    async signTypedData<
      const TTypedData extends TypedData | Record<string, unknown>,
      TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
    >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      return signTypedData<TTypedData, TPrimaryType, TChain, undefined>(
        // @ts-ignore
        config.walletClient,
        {
          account: viemSigner,
          ...typedData
        }
      )
    }
  })

  return {
    ...account,
    client: client,
    publicKey: accountAddress,
    entryPoint: DEFAULT_ENTRYPOINT_ADDRESS,
    source: "BiconomySmartAccountV3",
    async getNonce() {
      return getNonce(client, accountAddress)
    },
    // async getAccountAddress() {
    //   return getAccountAddress({
    //     validationModule: defaultValidationModule,
    //     factoryAddress:
    //       config.factoryAddress ?? DEFAULT_BICONOMY_FACTORY_ADDRESS,
    //     accountLogicAddress: ACCOUNT_V2_0_LOGIC,
    //     fallbackHandlerAddress: DEFAULT_FALLBACK_HANDLER_ADDRESS,
    //     index: config.accountIndex ? BigInt(config.accountIndex) : 0n
    //   })
    // },
    async signUserOperation(userOperation: UserOperationStruct) {
      return account.signMessage({
        message: {
          raw: getUserOperationHash(userOperation, chainId)
        }
      })
    },
    async getInitCode() {
      if (smartAccountDeployed) return "0x"

      smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
      )

      if (smartAccountDeployed) return "0x"

      return concatHex([
        config.factoryAddress ?? DEFAULT_BICONOMY_FACTORY_ADDRESS,
        await getAccountInitCode({
          owner: viemSigner.address,
          index: BigInt(config.accountIndex ?? 0),
          moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE
        })
      ])
    },
    async getFactory() {
      return "0x"
      //     if (smartAccountDeployed) return undefined
      //     smartAccountDeployed = await isSmartAccountDeployed(
      //         client,
      //         accountAddress
      //     )
      //     if (smartAccountDeployed) return undefined
      //     return factoryAddress
    },
    async getFactoryData() {
      return "0x"
      //     if (smartAccountDeployed) return undefined
      //     smartAccountDeployed = await isSmartAccountDeployed(
      //         client,
      //         accountAddress
      //     )
      //     if (smartAccountDeployed) return undefined
      //     return getAccountInitCode(viemSigner.address, index)
    },
    async encodeDeployCallData(_) {
      throw new Error("Simple account doesn't support account deployment")
    },
    async encodeCallData(args) {
      if (Array.isArray(args)) {
        // Encode a batched call
        const argsArray = args as {
          to: Address
          value: bigint
          data: Hex
        }[]

        return encodeFunctionData({
          abi: BiconomyExecuteAbi,
          functionName: "executeBatch_y6U",
          args: [
            argsArray.map((a) => a.to),
            argsArray.map((a) => a.value),
            argsArray.map((a) => a.data)
          ]
        })
      }
      const { to, value, data } = args as {
        to: Address
        value: bigint
        data: Hex
      }
      // Encode a simple call
      return encodeFunctionData({
        abi: BiconomyExecuteAbi,
        functionName: "execute_ncC",
        args: [to, value, data]
      })
    },
    async getDummySignature(_userOperation) {
      return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
    }
  }
}
