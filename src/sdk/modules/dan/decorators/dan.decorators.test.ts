import { http, type Address, type Chain, type LocalAccount, isHex } from "viem"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { danActions, toDAN } from ".."
import { toNetwork } from "../../../../test/testSetup"
import {
  type MasterClient,
  type NetworkConfig,
  getTestAccount,
  killNetwork,
  toTestClient,
  topUp
} from "../../../../test/testUtils"
import type { NexusAccount } from "../../../account/toNexusAccount"
import {
  type NexusClient,
  createNexusClient
} from "../../../clients/createNexusClient"

describe("modules.dan.decorators", async () => {
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

  test.concurrent("should test dan decorators", async () => {
    const danModule = toDAN({
      account: nexusClient.account,
      signer: nexusClient.account.signer
    })

    const danNexusClient = nexusClient.extend(danActions(danModule))

    // const [key, userOp] = await Promise.all([
    //   danNexusClient.generateMPCKey(),
    //   danNexusClient.sendUserOperation({
    //     calls: [{ to: userTwo.address, value: 1n }],
    //     verificationGasLimit: 1n,
    //     preVerificationGas: 1n,
    //     callGasLimit: 1n,
    //     account: danNexusClient.account as NexusAccount
    //   })
    // ])

    // console.log({ userOp })

    // expect(isHex(key)).toBe(true)
  })
})
