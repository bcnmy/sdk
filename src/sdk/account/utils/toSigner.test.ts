import { JsonRpcProvider } from "ethers"
import { http, type Address, type Hex, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import { type NetworkConfig, killNetwork, pKey } from "../../../test/testUtils"
import { addressEquals } from "./Utils"
import { toSigner } from "./toSigner"

const TEST_TYPED_DATA = {
  primaryType: "Person",
  domain: {
    name: "Test Protocol",
    version: "1",
    chainId: 1,
    verifyingContract: "0x0000000000000000000000000000000000000001" as Address
  },
  types: {
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" }
    ]
  },
  message: {
    name: "Bob",
    wallet: "0x0000000000000000000000000000000000000001"
  }
} as const

describe("to.signer", () => {
  let network: NetworkConfig

  beforeAll(async () => {
    network = await toNetwork()
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  it("should work with viem WalletClient", async () => {
    const account = privateKeyToAccount(pKey as Hex)
    const client = createWalletClient({
      account,
      chain: network.chain,
      transport: http(network.rpcUrl)
    })

    const signer = await toSigner({ signer: client })

    expect(addressEquals(signer.address, account.address)).toBe(true)

    // Test message signing
    const signature = await signer.signMessage({ message: "Hello World" })
    expect(signature).toBeTruthy()
    expect(typeof signature).toBe("string")

    // Test typed data signing
    const typedSignature = await signer.signTypedData(TEST_TYPED_DATA)
    expect(typedSignature).toBeTruthy()
    expect(typeof typedSignature).toBe("string")
  })

  it("should work with viem Account", async () => {
    const account = privateKeyToAccount(pKey as Hex)
    const signer = await toSigner({ signer: account })

    expect(signer.address).toBe(account.address)

    const signature = await signer.signMessage({ message: "Hello World" })
    expect(signature).toBeTruthy()
  })
})
