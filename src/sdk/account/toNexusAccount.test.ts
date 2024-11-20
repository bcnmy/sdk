import { getAddress, getBytes, hexlify } from "ethers"
import {
  http,
  type Address,
  type Chain,
  type Hex,
  type LocalAccount,
  type PublicClient,
  type WalletClient,
  concat,
  concatHex,
  createWalletClient,
  domainSeparator,
  encodeAbiParameters,
  encodePacked,
  getContract,
  hashMessage,
  isAddress,
  isHex,
  keccak256,
  parseAbi,
  parseAbiParameters,
  parseEther,
  toBytes,
  toHex
} from "viem"
import type { UserOperation } from "viem/account-abstraction"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { MockSignatureValidatorAbi } from "../../test/__contracts/abi/MockSignatureValidatorAbi"
import { TokenWithPermitAbi } from "../../test/__contracts/abi/TokenWithPermitAbi"
import { testAddresses } from "../../test/callDatas"
import { toNetwork } from "../../test/testSetup"
import {
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../test/testUtils"
import type { MasterClient, NetworkConfig } from "../../test/testUtils"
import {
  type NexusClient,
  createNexusClient
} from "../clients/createNexusClient"
import { k1ValidatorAddress } from "../constants"
import type { NexusAccount } from "./toNexusAccount"
import {
  addressEquals,
  getAccountDomainStructFields,
  getAccountMeta
} from "./utils"
import {
  NEXUS_DOMAIN_TYPEHASH,
  PARENT_TYPEHASH,
  eip1271MagicValue
} from "./utils/Constants"
import type { BytesLike } from "./utils/Types"

describe("nexus.account", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let userTwo: LocalAccount
  let nexusAccountAddress: Address
  let nexusClient: NexusClient
  let nexusAccount: NexusAccount
  let walletClient: WalletClient

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    userTwo = getTestAccount(1)
    testClient = toTestClient(chain, getTestAccount(5))

    walletClient = createWalletClient({
      account: eoaAccount,
      chain,
      transport: http()
    })

    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    nexusAccount = nexusClient.account
    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await fundAndDeployClients(testClient, [nexusClient])
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should override account address", async () => {
    const newNexusClient = await createNexusClient({
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl),
      accountAddress: "0xf0479e036343bC66dc49dd374aFAF98402D0Ae5f",
      signer: eoaAccount
    })
    const accountAddress = await newNexusClient.account.getAddress()
    expect(accountAddress).toBe("0xf0479e036343bC66dc49dd374aFAF98402D0Ae5f")
  })

  test("should check isValidSignature PersonalSign is valid", async () => {
    const meta = await getAccountMeta(testClient, nexusAccountAddress)

    const data = hashMessage("0x1234")

    // Calculate the domain separator
    const domainSeparator = keccak256(
      encodeAbiParameters(
        parseAbiParameters("bytes32, bytes32, bytes32, uint256, address"),
        [
          keccak256(toBytes(NEXUS_DOMAIN_TYPEHASH)),
          keccak256(toBytes(meta.name)),
          keccak256(toBytes(meta.version)),
          BigInt(chain.id),
          nexusAccountAddress
        ]
      )
    )

    // Calculate the parent struct hash
    const parentStructHash = keccak256(
      encodeAbiParameters(parseAbiParameters("bytes32, bytes32"), [
        keccak256(toBytes("PersonalSign(bytes prefixed)")),
        hashMessage(data)
      ])
    )

    // Calculate the final hash
    const resultHash: Hex = keccak256(
      concat(["0x1901", domainSeparator, parentStructHash])
    )

    const signature = await nexusAccount.signMessage({
      message: { raw: toBytes(resultHash) }
    })

    const contractResponse = await testClient.readContract({
      address: nexusAccountAddress,
      abi: parseAbi([
        "function isValidSignature(bytes32,bytes) external view returns (bytes4)"
      ]),
      functionName: "isValidSignature",
      args: [hashMessage(data), signature]
    })

    const viemResponse = await testClient.verifyMessage({
      address: nexusAccountAddress,
      message: data,
      signature
    })

    expect(contractResponse).toBe(eip1271MagicValue)
    expect(viemResponse).toBe(true)
  })

  test("should verify signatures", async () => {
    const mockSigVerifierContract = getContract({
      address: testAddresses.MockSignatureValidator,
      abi: MockSignatureValidatorAbi,
      client: testClient
    })

    const message = "Hello World"
    const messageHash = keccak256(toBytes(message))

    // Sign with regular hash
    const signature = await eoaAccount.signMessage({
      message: { raw: messageHash }
    })

    // Sign with Ethereum signed message
    const ethSignature = await eoaAccount.signMessage({
      message
    })

    const isValidRegular = await mockSigVerifierContract.read.verify([
      messageHash,
      signature,
      eoaAccount.address
    ])

    // Verify Ethereum signed message
    const ethMessageHash = hashMessage(message)
    const isValidEthSigned = await mockSigVerifierContract.read.verify([
      ethMessageHash,
      ethSignature,
      eoaAccount.address
    ])

    expect(isValidRegular).toBe(true)
    expect(isValidEthSigned).toBe(true)
  })

  test.skip("should verify signatures from prepared UserOperation", async () => {
    const mockSigVerifierContract = getContract({
      address: testAddresses.MockSignatureValidator,
      abi: MockSignatureValidatorAbi,
      client: testClient
    })

    const userOperation = await nexusClient.prepareUserOperation({
      calls: [{ to: userTwo.address, value: 1n }]
    })

    const userOpHash = await nexusClient.account.getUserOpHash(userOperation)

    const isValid = await mockSigVerifierContract.read.verify([
      userOpHash,
      userOperation.signature,
      eoaAccount.address
    ])

    expect(isValid).toBe(true)
  })

  test("should have 4337 account actions", async () => {
    const [
      isDeployed,
      counterfactualAddress,
      userOpHash,
      address,
      factoryArgs,
      stubSignature,
      signedMessage,
      nonce,
      initCode,
      encodedExecute,
      encodedExecuteBatch,
      entryPointVersion
    ] = await Promise.all([
      nexusAccount.isDeployed(),
      nexusAccount.getCounterFactualAddress(),
      nexusAccount.getUserOpHash({
        sender: eoaAccount.address,
        nonce: 0n,
        data: "0x",
        signature: "0x",
        verificationGasLimit: 1n,
        preVerificationGas: 1n,
        callData: "0x",
        callGasLimit: 1n,
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 1n
      } as UserOperation),
      nexusAccount.getAddress(),
      nexusAccount.getFactoryArgs(),
      nexusAccount.getStubSignature(),
      nexusAccount.signMessage({ message: "hello" }),
      nexusAccount.getNonce(),
      nexusAccount.getInitCode(),
      nexusAccount.encodeExecute({ to: eoaAccount.address, value: 100n }),
      nexusAccount.encodeExecuteBatch([
        { to: eoaAccount.address, value: 100n }
      ]),
      nexusClient.account.entryPoint.version
    ])

    expect(isAddress(counterfactualAddress)).toBe(true)
    expect(isHex(userOpHash)).toBe(true)
    expect(isAddress(address)).toBe(true)
    expect(address).toBe(nexusAccountAddress)

    if (isDeployed) {
      expect(factoryArgs.factory).toBe(undefined)
      expect(factoryArgs.factoryData).toBe(undefined)
    } else {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      expect(isAddress(factoryArgs.factory!)).toBe(true)
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      expect(isHex(factoryArgs.factoryData!)).toBe(true)
    }

    expect(isHex(stubSignature)).toBe(true)
    expect(isHex(signedMessage)).toBe(true)
    expect(typeof nonce).toBe("bigint")
    expect(initCode.indexOf(nexusAccount.factoryAddress) > -1).toBe(true)
    expect(typeof isDeployed).toBe("boolean")

    expect(isHex(encodedExecute)).toBe(true)
    expect(isHex(encodedExecuteBatch)).toBe(true)
    expect(entryPointVersion).toBe("0.7")
  })

  test("should test isValidSignature EIP712Sign to be valid with viem", async () => {
    const message = {
      contents: keccak256(toBytes("test", { size: 32 }))
    }

    const domainSeparator = await testClient.readContract({
      address: await nexusAccount.getAddress(),
      abi: parseAbi([
        "function DOMAIN_SEPARATOR() external view returns (bytes32)"
      ]),
      functionName: "DOMAIN_SEPARATOR"
    })

    const typedHashHashed = keccak256(
      concat(["0x1901", domainSeparator, message.contents])
    )

    const accountDomainStructFields = await getAccountDomainStructFields(
      testClient as unknown as PublicClient,
      nexusAccountAddress
    )

    const parentStructHash = keccak256(
      encodePacked(
        ["bytes", "bytes"],
        [
          encodeAbiParameters(parseAbiParameters(["bytes32, bytes32"]), [
            keccak256(toBytes(PARENT_TYPEHASH)),
            message.contents
          ]),
          accountDomainStructFields
        ]
      )
    )

    const dataToSign = keccak256(
      concat(["0x1901", domainSeparator, parentStructHash])
    )

    const signature = await walletClient.signMessage({
      account: eoaAccount,
      message: { raw: toBytes(dataToSign) }
    })

    const contentsType = toBytes("Contents(bytes32 stuff)")

    const signatureData = concatHex([
      signature,
      domainSeparator,
      message.contents,
      toHex(contentsType),
      toHex(contentsType.length, { size: 2 })
    ])

    const finalSignature = encodePacked(
      ["address", "bytes"],
      [k1ValidatorAddress, signatureData]
    )

    const contractResponse = await testClient.readContract({
      address: nexusAccountAddress,
      abi: parseAbi([
        "function isValidSignature(bytes32,bytes) external view returns (bytes4)"
      ]),
      functionName: "isValidSignature",
      args: [typedHashHashed, finalSignature]
    })

    expect(contractResponse).toBe(eip1271MagicValue)
  })

  test("should sign using signTypedData SDK method", async () => {
    const appDomain = {
      chainId: chain.id,
      name: "TokenWithPermit",
      verifyingContract: testAddresses.TokenWithPermit,
      version: "1"
    }

    const primaryType = "Contents"
    const types = {
      Contents: [
        {
          name: "stuff",
          type: "bytes32"
        }
      ]
    }

    const permitTypehash = keccak256(
      toBytes(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
      )
    )
    const nonce = (await testClient.readContract({
      address: testAddresses.TokenWithPermit,
      abi: TokenWithPermitAbi,
      functionName: "nonces",
      args: [nexusAccountAddress]
    })) as bigint

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now

    const message = {
      stuff: keccak256(
        encodeAbiParameters(
          parseAbiParameters(
            "bytes32, address, address, uint256, uint256, uint256"
          ),
          [
            permitTypehash,
            nexusAccountAddress,
            nexusAccountAddress,
            parseEther("2"),
            nonce,
            deadline
          ]
        )
      )
    }

    const appDomainSeparator = domainSeparator({
      domain: appDomain
    })

    const contentsHash = keccak256(
      concat(["0x1901", appDomainSeparator, message.stuff])
    )

    const finalSignature = await nexusClient.signTypedData({
      domain: appDomain,
      primaryType,
      types,
      message
    })

    const nexusResponse = await testClient.readContract({
      address: nexusAccountAddress,
      abi: parseAbi([
        "function isValidSignature(bytes32,bytes) external view returns (bytes4)"
      ]),
      functionName: "isValidSignature",
      args: [contentsHash, finalSignature]
    })

    const permitTokenResponse = await nexusClient.writeContract({
      address: testAddresses.TokenWithPermit,
      abi: TokenWithPermitAbi,
      functionName: "permitWith1271",
      chain: network.chain,
      args: [
        nexusAccountAddress,
        nexusAccountAddress,
        parseEther("2"),
        deadline,
        finalSignature
      ]
    })

    await nexusClient.waitForTransactionReceipt({ hash: permitTokenResponse })

    const allowance = await testClient.readContract({
      address: testAddresses.TokenWithPermit,
      abi: TokenWithPermitAbi,
      functionName: "allowance",
      args: [nexusAccountAddress, nexusAccountAddress]
    })

    expect(allowance).toEqual(parseEther("2"))
    expect(nexusResponse).toEqual("0x1626ba7e")
  })

  test("check that ethers makeNonceKey creates the same key as the SDK", async () => {
    function makeNonceKey(
      vMode: BytesLike,
      validator: Hex,
      batchId: BytesLike
    ): string {
      // Convert the validator address to a Uint8Array
      const validatorBytes = getBytes(getAddress(validator.toString()))

      // Prepare the validation mode as a 1-byte Uint8Array
      const validationModeBytes = Uint8Array.from([Number(vMode)])

      // Convert the batchId to a Uint8Array (assuming it's 3 bytes)
      const batchIdBytes = getBytes(batchId)

      // Create a 24-byte array for the 192-bit key
      const keyBytes = new Uint8Array(24)

      // Set the batchId in the most significant 3 bytes (positions 0, 1, and 2)
      keyBytes.set(batchIdBytes, 0)

      // Set the validation mode at the 4th byte (position 3)
      keyBytes.set(validationModeBytes, 3)

      // Set the validator address starting from the 5th byte (position 4)
      keyBytes.set(validatorBytes, 4)

      // Return the key as a hex string
      return hexlify(keyBytes)
    }

    function numberTo3Bytes(key: bigint): Uint8Array {
      // todo: check range
      const buffer = new Uint8Array(3)
      buffer[0] = Number((key >> 16n) & 0xffn)
      buffer[1] = Number((key >> 8n) & 0xffn)
      buffer[2] = Number(key & 0xffn)
      return buffer
    }

    function toHexString(key: bigint): string {
      const key_ = numberTo3Bytes(key)
      return `0x${Array.from(key_)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")}`
    }

    const nonce = 5n
    const nonceAsHex = toHexString(nonce)

    const keyFromEthers = makeNonceKey(
      "0x00",
      nexusClient.account.getModule().address,
      nonceAsHex
    )
    const keyFromViem = concat([
      toHex(nonce, { size: 3 }),
      "0x00",
      nexusClient.account.getModule().address
    ])

    const keyWithHardcodedValues = concat([
      "0x000005",
      "0x00",
      nexusClient.account.getModule().address
    ])

    expect(addressEquals(keyFromViem, keyFromEthers)).toBe(true)
    expect(addressEquals(keyWithHardcodedValues, keyFromEthers)).toBe(true)
  })
})
