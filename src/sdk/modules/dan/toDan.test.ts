import {
  http,
  type Address,
  type Chain,
  type LocalAccount,
  parseEther
} from "viem"
import { afterAll, beforeAll, describe, test } from "vitest"
import { toNetwork } from "../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  fundAndDeployClients,
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp
} from "../../../test/testUtils"
import type { NexusAccount } from "../../account/toNexusAccount"
import {
  type NexusClient,
  createNexusClient
} from "../../clients/createNexusClient"
import { danActions } from "./decorators"
import { toDAN } from "./toDan"

describe("modules.toDAN.dx", async () => {
  let network: NetworkConfig
  let chain: Chain
  let bundlerUrl: string

  // Test utils
  let testClient: MasterClient
  let eoaAccount: LocalAccount
  let nexusAccountAddress: Address
  let nexusClient: NexusClient
  let userTwo: LocalAccount
  let userThree: LocalAccount

  beforeAll(async () => {
    network = await toNetwork()

    chain = network.chain
    bundlerUrl = network.bundlerUrl
    eoaAccount = getTestAccount(0)
    userTwo = getTestAccount(1)
    userThree = getTestAccount(2)
    testClient = toTestClient(chain, getTestAccount(5))

    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    nexusAccountAddress = await nexusClient.account.getCounterFactualAddress()
    await topUp(testClient, nexusAccountAddress)
  })
  afterAll(async () => {
    await killNetwork([network?.rpcPort, network?.bundlerPort])
  })

  test("should demonstrate dan module dx", async () => {
    nexusClient = await createNexusClient({
      signer: eoaAccount,
      chain,
      transport: http(),
      bundlerTransport: http(bundlerUrl)
    })

    await fundAndDeployClients(testClient, [nexusClient])

    const danModule = toDAN({
      account: nexusClient.account,
      signer: eoaAccount
    })
    const danNexusClient = nexusClient.extend(danActions(danModule))

    const key = await danNexusClient.generateKey()

    console.log({ key })
  })
})
