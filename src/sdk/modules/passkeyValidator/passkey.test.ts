import { http, type Account, type Address, type Chain } from "viem"
import { afterAll, beforeAll, describe, test } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient
} from "../../../test/testUtils"
import { createNexusClient } from "../../clients"
import type { NexusClient } from "../../clients"
import { toPasskeyValidator } from "./toPasskeyValidator"
import { WebAuthnMode, toWebAuthnKey } from "./toWebAuthnKey"

describe("modules.passkeyValidator", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: Account
  let nexusClient: NexusClient
  let nexusAccountAddress: Address
  let recipient: Account
  let recipientAddress: Address

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    recipient = getTestAccount(1)
    recipientAddress = recipient.address

    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await fundAndDeployClients(testClient, [nexusClient])
  })

  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("test", async () => {
    const webAuthnKey = await toWebAuthnKey({
      passkeyName: "test",
      passkeyServerUrl:
        "https://passkeys.zerodev.app/api/v3/d67a0b6b-ccd5-4d12-9e57-048f3ad4c682",
      mode: WebAuthnMode.Register,
      passkeyServerHeaders: {}
    })

    const passkeyValidator = await toPasskeyValidator(testClient, {
      webAuthnKey
    })

    console.log(passkeyValidator, "passkeyValidator")
  })
})
