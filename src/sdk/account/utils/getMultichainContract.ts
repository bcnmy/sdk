import type {
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames
} from "abitype"
import type {
  Abi,
  Address,
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  ContractFunctionReturnType,
  EncodeFunctionDataParameters,
  PublicClient,
  Transport
} from "viem"
import { encodeFunctionData } from "viem"
import type {
  AbstractCall,
  Instruction
} from "../../clients/decorators/mee/getQuote"
import type { MultichainSmartAccount } from "../toMultiChainNexusAccount"
/**
 * Contract instance capable of encoding transactions across multiple chains
 * @template TAbi - The contract ABI type
 */
export type MultichainContract<TAbi extends Abi> = {
  abi: TAbi
  deployments: Map<number, Address>
  on: (chainId: number) => ChainSpecificContract<TAbi>
  addressOn: (chainId: number) => Address
  read: <
    TFunctionName extends ContractFunctionName<TAbi, "pure" | "view">
  >(params: {
    onChains: Chain[]
    functionName: TFunctionName
    args: ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>
    account: MultichainSmartAccount
  }) => Promise<
    Array<{
      chainId: number
      result: ContractFunctionReturnType<TAbi, "pure" | "view", TFunctionName>
    }>
  >
}

export type ChainSpecificContract<TAbi extends Abi> = {
  [TFunctionName in ExtractAbiFunctionNames<TAbi>]: (params: {
    args: AbiParametersToPrimitiveTypes<
      ExtractAbiFunction<TAbi, TFunctionName>["inputs"]
    >
    gasLimit: bigint
    value?: bigint
  }) => Instruction
}

function createChainSpecificContract<TAbi extends Abi>(
  abi: TAbi,
  chainId: number,
  address: Address
): ChainSpecificContract<TAbi> {
  return new Proxy({} as ChainSpecificContract<TAbi>, {
    get: (_: ChainSpecificContract<TAbi>, prop: string) => {
      if (!abi.some((item) => item.type === "function" && item.name === prop)) {
        throw new Error(`Function ${prop} not found in ABI`)
      }

      return ({
        args,
        gasLimit,
        value = 0n
      }: {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        args: any[] // This will be typed by the ChainSpecificContract type
        gasLimit: bigint
        value?: bigint
      }) => {
        const params: EncodeFunctionDataParameters = {
          abi,
          functionName: prop,
          args
        }
        const data = encodeFunctionData(params)

        const call: AbstractCall = {
          to: address,
          gasLimit,
          value,
          data
        }

        return {
          calls: [call],
          chainId
        }
      }
    }
  })
}

/**
 * Creates a contract instance that can encode function calls across multiple chains
 * @template TAbi The contract ABI type
 * @example
 * const mcUSDC = getMultichainContract({
 *   abi: erc20ABI,
 *   deployments: [
 *     ['0x...', optimism.id],
 *     ['0x...', base.id],
 *     // Other chains
 *   ]
 * });
 *
 * const transferOp = usdc.on(optimism.id).transfer({
 *   args: ['0x...', 100n],
 *   gasLimit: 100000n
 * });
 */
export function getMultichainContract<TAbi extends Abi>(config: {
  abi: TAbi
  deployments: [Address, number][]
}): MultichainContract<TAbi> {
  const deployments = new Map(
    config.deployments.map((deployment) => {
      const [address, chainId] = deployment
      return [chainId, address]
    })
  )
  return {
    abi: config.abi,
    deployments,
    on: (chainId: number) => {
      const address = deployments.get(chainId)
      if (!address) {
        throw new Error(`No deployment found for chain ${chainId}`)
      }

      return createChainSpecificContract(config.abi, chainId, address)
    },
    addressOn: (chainId: number) => {
      const address = deployments.get(chainId)
      if (!address) {
        throw new Error(`No deployment found for chain ${chainId}`)
      }
      return address
    },
    read: async <
      TFunctionName extends ContractFunctionName<TAbi, "pure" | "view">
    >(params: {
      onChains: Chain[]
      functionName: TFunctionName
      args: ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>
      account: MultichainSmartAccount
    }): Promise<
      Array<{
        chainId: number
        result: ContractFunctionReturnType<TAbi, "pure" | "view", TFunctionName>
      }>
    > => {
      const abiFunction = config.abi.find(
        (
          item
        ): item is Extract<
          TAbi[number],
          { type: "function"; stateMutability: "view" | "pure" }
        > =>
          item.type === "function" &&
          item.name === params.functionName &&
          (item.stateMutability === "view" || item.stateMutability === "pure")
      )

      if (!abiFunction) {
        throw new Error(
          `Function ${params.functionName} not found in ABI or is not a read function`
        )
      }

      const results = await Promise.all(
        params.onChains.map(async (chain) => {
          const address = deployments.get(chain.id)
          if (!address) {
            throw new Error(`No deployment found for chain ${chain.id}`)
          }

          const deployment = params.account.deploymentOn(chain.id)
          if (!deployment) {
            throw new Error(`No deployment found for chain ${chain.id}`)
          }
          const client = deployment.client as PublicClient<Transport, Chain>

          const result = await client.readContract({
            address,
            abi: config.abi,
            functionName: params.functionName,
            args: params.args
          })

          return {
            chainId: chain.id,
            result: result as ContractFunctionReturnType<
              TAbi,
              "pure" | "view",
              TFunctionName
            >
          }
        })
      )

      return results
    }
  }
}
