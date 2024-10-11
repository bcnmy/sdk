import { OWNABLE_VALIDATOR_ADDRESS } from "@rhinestone/module-sdk"
import type { Address, Client, Hex, LocalAccount } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { parseAccount } from "viem/accounts"
import addresses from "../../__contracts/addresses"
import { type Signer, addressEquals } from "../../account"
import type { NexusClient } from "../../clients"
import { toK1ValidatorModule } from "./k1Validator/toK1ValidatorModule"
import { toOwnableValidatorModule } from "./ownableValidator/toOwnableValidatorModule"
import { toUseSessionModule } from "./smartSessionValidator/toUseSessionModule"
import type { ModuleImplementation } from "./types"

type SupportedModule = "smartSession" | "ownable" | "k1"
type ToValidatorModuleParameters = {
  accountAddress?: Address
  account: SmartAccount
  signer: Signer
  data?: ModuleImplementation["data"]
}

const MODULE_HELPERS: Record<
  SupportedModule,
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  { func: Function; address: Hex }
> = {
  smartSession: {
    func: toUseSessionModule,
    address: addresses.SmartSession
  },
  ownable: {
    func: toOwnableValidatorModule,
    address: OWNABLE_VALIDATOR_ADDRESS
  },
  k1: {
    func: toK1ValidatorModule,
    address: OWNABLE_VALIDATOR_ADDRESS
  }
}

export const activateModule = (
  client: Client,
  supportedModule: SupportedModule,
  data?: ModuleImplementation["data"]
) => {
  const nexusAccount = parseAccount((client as NexusClient)?.account)
  const activeModule = nexusAccount?.getActiveModule()

  if (
    !addressEquals(
      activeModule.address,
      MODULE_HELPERS[supportedModule].address
    )
  ) {
    const signer = nexusAccount?.client?.account as LocalAccount
    const eoaAccountAddress = signer?.address

    if (!signer || !eoaAccountAddress) {
      throw new Error("Module not activated")
    }

    const validatorParameters: ToValidatorModuleParameters = {
      accountAddress: nexusAccount?.address,
      account: nexusAccount,
      signer,
      data
    }

    nexusAccount.setActiveModule(
      MODULE_HELPERS[supportedModule].func(validatorParameters)
    )
  }
}
