import type { TypedData } from "viem"
import {
  type Address,
  type Chain,
  type Client,
  type Hex,
  type LocalAccount,
  type Transport,
  type TypedDataDefinition,
  concatHex,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  hexToBigInt,
  keccak256,
  parseAbiParameters
} from "viem"
import {
  getBytecode,
  getChainId,
  signMessage,
  signTypedData
} from "viem/actions"
import type { Prettify } from "viem/chains"

import {
  type BaseValidationModule,
  createECDSAOwnershipModule
} from "../../modules/index.js"
import { BiconomyExecuteAbi, BiconomyInitAbi } from "../utils/abis"
import { ENTRYPOINT_ADDRESS_V06 } from "../utils/constants.js"
import {
  getUserOperationHash,
  toSmartAccount,
  validateUserOp
} from "../utils/helpers.js"
import type { SmartAccount, SmartAccountSigner } from "../utils/types.js"

export type BiconomySmartAccount<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined
> = SmartAccount<"biconomySmartAccount", transport, chain> & {
  defaultValidationModule: BaseValidationModule
  activeValidationModule: BaseValidationModule
  setActiveValidationModule: (
    moduleAddress: BaseValidationModule
  ) => BaseValidationModule
}

/**
 * The account creation ABI for Biconomy Smart Account (from the biconomy SmartAccountFactory)
 */

const createAccountAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "moduleSetupContract",
        type: "address"
      },
      {
        internalType: "bytes",
        name: "moduleSetupData",
        type: "bytes"
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256"
      }
    ],
    name: "deployCounterFactualAccount",
    outputs: [
      {
        internalType: "address",
        name: "proxy",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

/**
 * Default addresses for Biconomy Smart Account
 */
const BICONOMY_ADDRESSES: {
  ACCOUNT_V2_0_LOGIC: Address
  FACTORY_ADDRESS: Address
  DEFAULT_FALLBACK_HANDLER_ADDRESS: Address
} = {
  ACCOUNT_V2_0_LOGIC: "0x0000002512019Dafb59528B82CB92D3c5D2423aC", // UPDATE FOR V7
  FACTORY_ADDRESS: "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5", // UPDATE FOR V7
  DEFAULT_FALLBACK_HANDLER_ADDRESS: "0x0bBa6d96BD616BedC6BFaa341742FD43c60b83C1" // UPDATE FOR V7
}

const BICONOMY_PROXY_CREATION_CODE =
  "0x6080346100aa57601f61012038819003918201601f19168301916001600160401b038311848410176100af578084926020946040528339810103126100aa57516001600160a01b0381168082036100aa5715610065573055604051605a90816100c68239f35b60405162461bcd60e51b815260206004820152601e60248201527f496e76616c696420696d706c656d656e746174696f6e206164647265737300006044820152606490fd5b600080fd5b634e487b7160e01b600052604160045260246000fdfe608060405230546000808092368280378136915af43d82803e156020573d90f35b3d90fdfea2646970667358221220a03b18dce0be0b4c9afe58a9eb85c35205e2cf087da098bbf1d23945bf89496064736f6c63430008110033"

/**
 * Get the account initialization code for Biconomy smart account with ECDSA as default authorization module
 * @param owner
 * @param index
 * @param factoryAddress
 * @param ecdsaValidatorAddress
 */
const getAccountInitCode = async ({
  owner,
  index,
  defaultValidationModule
}: {
  owner: Address
  index: bigint
  defaultValidationModule: BaseValidationModule
}): Promise<Hex> => {
  if (!owner) throw new Error("Owner account not found")

  // Build the account init code
  return encodeFunctionData({
    abi: createAccountAbi,
    functionName: "deployCounterFactualAccount",
    args: [
      defaultValidationModule.getModuleAddress(),
      await defaultValidationModule.getInitData(),
      index
    ]
  })
}

export const isSmartAccountDeployed = async (
  client: Client,
  address: Address
): Promise<boolean> => {
  const contractCode = await getBytecode(client, {
    address: address
  })

  if ((contractCode?.length ?? 0) > 2) {
    return true
  }
  return false
}

const getAccountAddress = async ({
  factoryAddress,
  accountLogicAddress,
  fallbackHandlerAddress,
  defaultValidationModule,
  index = 0n
}: {
  factoryAddress: Address
  accountLogicAddress: Address
  fallbackHandlerAddress: Address
  defaultValidationModule: BaseValidationModule
  index?: bigint
}): Promise<Address> => {
  // Build account init code
  const initialisationData = encodeFunctionData({
    abi: BiconomyInitAbi,
    functionName: "init",
    args: [
      fallbackHandlerAddress,
      defaultValidationModule.getModuleAddress(),
      await defaultValidationModule.getInitData()
    ]
  })

  const deploymentCode = encodePacked(
    ["bytes", "uint256"],
    [BICONOMY_PROXY_CREATION_CODE, hexToBigInt(accountLogicAddress)]
  )

  const salt = keccak256(
    encodePacked(
      ["bytes32", "uint256"],
      [keccak256(encodePacked(["bytes"], [initialisationData])), index]
    )
  )

  return getContractAddress({
    from: factoryAddress,
    salt,
    bytecode: deploymentCode,
    opcode: "CREATE2"
  })
}

export type SignerToBiconomySmartAccountParameters<
  TSource extends string = string,
  TAddress extends Address = Address
> = Prettify<{
  signer: SmartAccountSigner<TSource, TAddress>
  address?: Address
  index?: bigint
  factoryAddress?: Address
  accountLogicAddress?: Address
  fallbackHandlerAddress?: Address
  defaultValidationModule?: BaseValidationModule
  activeValidationModule?: BaseValidationModule
}>

/**
 * Build a Biconomy modular smart account from a private key, that use the ECDSA signer behind the scene
 * @param client
 * @param privateKey
 * @param index
 * @param factoryAddress
 * @param accountLogicAddress
 * @param defaultValidationModule
 * @param activeValidationModule
 */
export async function signerToSmartAccount<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TSource extends string = string,
  TAddress extends Address = Address
>(
  client: Client<TTransport, TChain, undefined>,
  {
    signer,
    address,
    index = 0n, // TODO: create test for index
    factoryAddress = BICONOMY_ADDRESSES.FACTORY_ADDRESS,
    accountLogicAddress = BICONOMY_ADDRESSES.ACCOUNT_V2_0_LOGIC,
    fallbackHandlerAddress = BICONOMY_ADDRESSES.DEFAULT_FALLBACK_HANDLER_ADDRESS,
    defaultValidationModule,
    activeValidationModule
  }: SignerToBiconomySmartAccountParameters<TSource, TAddress>
): Promise<BiconomySmartAccount<TTransport, TChain>> {
  // Get the private key related account
  const viemSigner: LocalAccount = {
    ...signer,
    signTransaction: (_, __) => {
      throw new Error("Sign transaction not supported by smart account.")
    }
  } as LocalAccount

  const _defaultValidationModule =
    defaultValidationModule ??
    (await createECDSAOwnershipModule({ signer: viemSigner }))
  let _activeValidationModule =
    activeValidationModule ?? _defaultValidationModule

  // Helper to generate the init code for the smart account
  const generateInitCode = async () =>
    getAccountInitCode({
      owner: viemSigner.address,
      index,
      defaultValidationModule: _defaultValidationModule
    })

  // Fetch account address and chain id
  const [accountAddress, chainId] = await Promise.all([
    address ??
      getAccountAddress({
        defaultValidationModule: _defaultValidationModule,
        factoryAddress,
        accountLogicAddress,
        fallbackHandlerAddress,
        index
      }),
    getChainId(client)
  ])

  if (!accountAddress) throw new Error("Account address not found")

  let smartAccountDeployed = await isSmartAccountDeployed(
    client,
    accountAddress
  )

  return toSmartAccount({
    address: accountAddress,
    defaultValidationModule: _defaultValidationModule,
    activeValidationModule: _activeValidationModule,
    async signMessage({ message }) {
      let signature: Hex = await signMessage(client, {
        account: viemSigner,
        message
      })
      const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
      if (![27, 28].includes(potentiallyIncorrectV)) {
        const correctV = potentiallyIncorrectV + 27
        signature = (signature.slice(0, -2) + correctV.toString(16)) as Hex
      }
      return encodeAbiParameters(
        [{ type: "bytes" }, { type: "address" }],
        [signature, _defaultValidationModule.getModuleAddress()]
      )
    },
    async signTransaction(_, __) {
      throw new Error("Sign transaction not supported by smart account.")
    },
    async signTypedData<
      const TTypedData extends TypedData | Record<string, unknown>,
      TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
    >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      let signature: Hex = await signTypedData<
        TTypedData,
        TPrimaryType,
        TChain,
        undefined
      >(client, {
        account: viemSigner,
        ...typedData
      })
      const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16)
      if (![27, 28].includes(potentiallyIncorrectV)) {
        const correctV = potentiallyIncorrectV + 27
        signature = (signature.slice(0, -2) + correctV.toString(16)) as Hex
      }
      return encodeAbiParameters(
        [{ type: "bytes" }, { type: "address" }],
        [signature, _defaultValidationModule.getModuleAddress()]
      )
    },
    client: client,
    publicKey: accountAddress,
    entryPoint: ENTRYPOINT_ADDRESS_V06,
    source: "biconomySmartAccount",

    // Get the nonce of the smart account
    async getNonce() {
      // @ts-ignore
      return await client.readContract({
        address: ENTRYPOINT_ADDRESS_V06,
        abi: [
          {
            inputs: [
              {
                name: "sender",
                type: "address"
              },
              {
                name: "key",
                type: "uint192"
              }
            ],
            name: "getNonce",
            outputs: [
              {
                name: "nonce",
                type: "uint256"
              }
            ],
            stateMutability: "view",
            type: "function"
          }
        ],
        functionName: "getNonce",
        args: [accountAddress, index ?? 0n] // TODO: check if index is correct here
      })
    },

    // Sign a user operation
    async signUserOperation(userOperation) {
      validateUserOp(userOperation)
      const hash = getUserOperationHash({
        userOperation: {
          ...userOperation,
          signature: "0x"
        },
        chainId: chainId
      })
      const signature = await signMessage(client, {
        account: viemSigner,
        message: { raw: hash }
      })
      // userOp signature is encoded module signature + module address
      const signatureWithModuleAddress = encodeAbiParameters(
        parseAbiParameters("bytes, address"),
        [signature, _defaultValidationModule.getModuleAddress()]
      )
      return signatureWithModuleAddress
    },

    async getFactory() {
      if (smartAccountDeployed) return undefined

      smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
      )

      if (smartAccountDeployed) return undefined

      return factoryAddress
    },

    async getFactoryData() {
      if (smartAccountDeployed) return undefined

      smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
      )

      if (smartAccountDeployed) return undefined
      return generateInitCode()
    },

    // Encode the init code
    async getInitCode() {
      if (smartAccountDeployed) return "0x"

      smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
      )

      if (smartAccountDeployed) return "0x"

      return concatHex([factoryAddress, await generateInitCode()])
    },

    // Encode the deploy call data
    async encodeDeployCallData(_) {
      throw new Error("Doesn't support account deployment")
    },

    // Encode a call
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

    // Get simple dummy signature for ECDSA module authorization
    async getDummySignature(_userOperation) {
      const moduleAddress = _activeValidationModule.getModuleAddress()
      const dynamicPart = moduleAddress.substring(2).padEnd(40, "0")
      return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`
    },

    setActiveValidationModule(
      validationModule: BaseValidationModule
    ): BaseValidationModule {
      _activeValidationModule = validationModule
      return _activeValidationModule
    }
  })
}
