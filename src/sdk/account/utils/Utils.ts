import {
  type Address,
  type Client,
  type Hash,
  type Hex,
  type PublicClient,
  type TypedData,
  type TypedDataDomain,
  type TypedDataParameter,
  concat,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  hexToBytes,
  keccak256,
  parseAbi,
  parseAbiParameters,
  publicActions,
  stringToBytes,
  toBytes,
  toHex
} from "viem"
import {
  MOCK_MULTI_MODULE_ADDRESS,
  MODULE_ENABLE_MODE_TYPE_HASH,
  NEXUS_DOMAIN_NAME,
  NEXUS_DOMAIN_TYPEHASH,
  NEXUS_DOMAIN_VERSION
} from "../../account/utils/Constants"
import { EIP1271Abi } from "../../constants/abi"
import {
  type AnyData,
  type ModuleType,
  moduleTypeIds
} from "../../modules/utils/Types"
import type { AccountMetadata, EIP712DomainReturn } from "./Types"

/**
 * Type guard to check if a value is null or undefined.
 *
 * @param value - The value to check
 * @returns True if the value is null or undefined
 */
export const isNullOrUndefined = (value: any): value is undefined => {
  return value === null || value === undefined
}

/**
 * Validates if a string is a valid RPC URL.
 *
 * @param url - The URL to validate
 * @returns True if the URL is a valid RPC endpoint
 */
export const isValidRpcUrl = (url: string): boolean => {
  const regex = /^(http:\/\/|wss:\/\/|https:\/\/).*/
  return regex.test(url)
}

/**
 * Compares two addresses for equality, case-insensitive.
 *
 * @param a - First address
 * @param b - Second address
 * @returns True if addresses are equal
 */
export const addressEquals = (a?: string, b?: string): boolean =>
  !!a && !!b && a?.toLowerCase() === b.toLowerCase()

/**
 * Parameters for wrapping a signature according to EIP-6492.
 */
export type SignWith6492Params = {
  /** The factory contract address */
  factoryAddress: Address
  /** The factory initialization calldata */
  factoryCalldata: Hex
  /** The original signature to wrap */
  signature: Hash
}

/**
 * Wraps a signature according to EIP-6492 specification.
 *
 * @param params - Parameters including factory address, calldata, and signature
 * @returns The wrapped signature
 */
export const wrapSignatureWith6492 = ({
  factoryAddress,
  factoryCalldata,
  signature
}: SignWith6492Params): Hash => {
  // wrap the signature as follows: https://eips.ethereum.org/EIPS/eip-6492
  // concat(
  //  abi.encode(
  //    (create2Factory, factoryCalldata, originalERC1271Signature),
  //    (address, bytes, bytes)),
  //    magicBytes
  // )
  return concat([
    encodeAbiParameters(parseAbiParameters("address, bytes, bytes"), [
      factoryAddress,
      factoryCalldata,
      signature
    ]),
    "0x6492649264926492649264926492649264926492649264926492649264926492"
  ])
}

/**
 * Calculates the percentage of a partial value relative to a total value.
 *
 * @param partialValue - The partial value
 * @param totalValue - The total value
 * @returns The percentage as a number
 */
export function percentage(partialValue: number, totalValue: number) {
  return (100 * partialValue) / totalValue
}

/**
 * Converts a percentage to a factor (e.g., 50% -> 1.5).
 *
 * @param percentage - The percentage value (1-100)
 * @returns The converted factor
 * @throws If percentage is outside valid range
 */
export function convertToFactor(percentage: number | undefined): number {
  // Check if the input is within the valid range
  if (percentage) {
    if (percentage < 1 || percentage > 100) {
      throw new Error("The percentage value should be between 1 and 100.")
    }

    // Calculate the factor
    const factor = percentage / 100 + 1

    return factor
  }
  return 1
}

/**
 * Generates installation data and hash for module installation.
 *
 * @param accountOwner - The account owner address
 * @param modules - Array of modules with their types and configurations
 * @param domainName - Optional domain name
 * @param domainVersion - Optional domain version
 * @returns Tuple of [installData, hash]
 */
export function makeInstallDataAndHash(
  accountOwner: Address,
  modules: { type: ModuleType; config: Hex }[],
  domainName = NEXUS_DOMAIN_NAME,
  domainVersion = NEXUS_DOMAIN_VERSION
): [string, string] {
  const types = modules.map((module) => BigInt(moduleTypeIds[module.type]))
  const initDatas = modules.map((module) =>
    toHex(concat([toBytes(BigInt(moduleTypeIds[module.type])), module.config]))
  )

  const multiInstallData = encodeAbiParameters(
    [{ type: "uint256[]" }, { type: "bytes[]" }],
    [types, initDatas]
  )

  const structHash = keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "address" }, { type: "bytes32" }],
      [
        MODULE_ENABLE_MODE_TYPE_HASH,
        MOCK_MULTI_MODULE_ADDRESS,
        keccak256(multiInstallData)
      ]
    )
  )

  const hashToSign = _hashTypedData(
    structHash,
    domainName,
    domainVersion,
    accountOwner
  )

  return [multiInstallData, hashToSign]
}

export function _hashTypedData(
  structHash: Hex,
  name: string,
  version: string,
  verifyingContract: Address
): string {
  const DOMAIN_SEPARATOR = keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "address" }
      ],
      [
        keccak256(stringToBytes(NEXUS_DOMAIN_TYPEHASH)),
        keccak256(stringToBytes(name)),
        keccak256(stringToBytes(version)),
        verifyingContract
      ]
    )
  )

  return keccak256(
    concat([
      stringToBytes("\x19\x01"),
      hexToBytes(DOMAIN_SEPARATOR),
      hexToBytes(structHash)
    ])
  )
}

export function getTypesForEIP712Domain({
  domain
}: { domain?: TypedDataDomain | undefined }): TypedDataParameter[] {
  return [
    typeof domain?.name === "string" && { name: "name", type: "string" },
    domain?.version && { name: "version", type: "string" },
    typeof domain?.chainId === "number" && {
      name: "chainId",
      type: "uint256"
    },
    domain?.verifyingContract && {
      name: "verifyingContract",
      type: "address"
    },
    domain?.salt && { name: "salt", type: "bytes32" }
  ].filter(Boolean) as TypedDataParameter[]
}

/**
 * Retrieves account metadata including name, version, and chain ID.
 *
 * @param client - The viem Client instance
 * @param accountAddress - The account address to query
 * @returns Promise resolving to account metadata
 */
export const getAccountMeta = async (
  client: Client,
  accountAddress: Address
): Promise<AccountMetadata> => {
  try {
    const domain = await client.request({
      method: "eth_call",
      params: [
        {
          to: accountAddress,
          data: encodeFunctionData({
            abi: EIP1271Abi,
            functionName: "eip712Domain"
          })
        },
        "latest"
      ]
    })

    if (domain !== "0x") {
      const decoded = decodeFunctionResult({
        abi: [...EIP1271Abi],
        functionName: "eip712Domain",
        data: domain
      })
      return {
        name: decoded?.[1],
        version: decoded?.[2],
        chainId: decoded?.[3]
      }
    }
  } catch (error) {}
  return {
    name: NEXUS_DOMAIN_NAME,
    version: NEXUS_DOMAIN_VERSION,
    chainId: client.chain
      ? BigInt(client.chain.id)
      : BigInt(await client.extend(publicActions).getChainId())
  }
}

/**
 * Wraps a typed data hash with EIP-712 domain separator.
 *
 * @param typedHash - The hash to wrap
 * @param appDomainSeparator - The domain separator
 * @returns The wrapped hash
 */
export const eip712WrapHash = (typedHash: Hex, appDomainSeparator: Hex): Hex =>
  keccak256(concat(["0x1901", appDomainSeparator, typedHash]))

export type TypedDataWith712 = {
  EIP712Domain: TypedDataParameter[]
} & TypedData

export function typeToString(typeDef: TypedDataWith712): string[] {
  return Object.entries(typeDef).map(([key, fields]) => {
    const fieldStrings = (fields ?? [])
      .map((field) => `${field.type} ${field.name}`)
      .join(",")
    return `${key}(${fieldStrings})`
  })
}

/** @ignore */
export function bigIntReplacer(_key: string, value: AnyData) {
  return typeof value === "bigint" ? value.toString() : value
}

export function numberTo3Bytes(key: bigint): Uint8Array {
  // todo: check range
  const buffer = new Uint8Array(3)
  buffer[0] = Number((key >> 16n) & 0xffn)
  buffer[1] = Number((key >> 8n) & 0xffn)
  buffer[2] = Number(key & 0xffn)
  return buffer
}

export function toHexString(byteArray: Uint8Array): string {
  return Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, "0")) // Convert each byte to hex and pad to 2 digits
    .join("") // Join all hex values together into a single string
}

export const getAccountDomainStructFields = async (
  publicClient: PublicClient,
  accountAddress: Address
) => {
  const accountDomainStructFields = (await publicClient.readContract({
    address: accountAddress,
    abi: parseAbi([
      "function eip712Domain() public view returns (bytes1 fields, string memory name, string memory version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] memory extensions)"
    ]),
    functionName: "eip712Domain"
  })) as EIP712DomainReturn

  const [fields, name, version, chainId, verifyingContract, salt, extensions] =
    accountDomainStructFields

  const params = parseAbiParameters([
    "bytes1, bytes32, bytes32, uint256, address, bytes32, bytes32"
  ])

  return encodeAbiParameters(params, [
    fields,
    keccak256(toBytes(name)),
    keccak256(toBytes(version)),
    chainId,
    verifyingContract,
    salt,
    keccak256(encodePacked(["uint256[]"], [extensions]))
  ])
}
export const playgroundTrue = process?.env?.RUN_PLAYGROUND === "true"
export const isTesting = process?.env?.TEST === "true"

/**
 * Safely multiplies a bigint by a number, rounding appropriately.
 *
 * @param bI - The bigint to multiply
 * @param multiplier - The multiplication factor
 * @returns The multiplied bigint
 */
export const safeMultiplier = (bI: bigint, multiplier: number): bigint =>
  BigInt(Math.round(Number(bI) * multiplier))
