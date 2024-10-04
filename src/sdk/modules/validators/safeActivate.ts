import { OWNABLE_VALIDATOR_ADDRESS } from "@rhinestone/module-sdk"
import type { Client, Hex, LocalAccount } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { parseAccount } from "viem/accounts"
import addresses from "../../__contracts/addresses"
import { type Signer, addressEquals } from "../../account"
import type { NexusClient } from "../../clients"
import { toOwnableValidatorModule } from "./ownableValidator/toOwnableValidatorModule"
import { toSmartSessionsModule } from "./smartSessionValidator/toSmartSessionsModule"
import type { ModuleImplementation } from "./types"

type SupportedModule = "smartSession" | "ownable"
type ToValidatorModuleParameters = {
  account: SmartAccount
  signer: Signer
  meta?: ModuleImplementation["meta"]
}

const MODULE_HELPERS: Record<
  SupportedModule,
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  { func: Function; address: Hex }
> = {
  smartSession: {
    func: toSmartSessionsModule,
    address: addresses.SmartSession
  },
  ownable: {
    func: toOwnableValidatorModule,
    address: OWNABLE_VALIDATOR_ADDRESS
  }
}

export const safeActivate = (
  client: Client,
  supportedModule: SupportedModule,
  meta?: ModuleImplementation["meta"]
) => {
  const nexusAccount = parseAccount((client as NexusClient)?.account)
  const activeModule = nexusAccount?.getActiveModule()

  if (!activeModule) throw new Error("No activated module")

  if (
    !addressEquals(
      activeModule.address,
      MODULE_HELPERS[supportedModule].address
    )
  ) {
    const signer = nexusAccount?.client?.account as LocalAccount
    const eoaAccountAddress = signer?.address

    if (!signer || !eoaAccountAddress) {
      throw new Error("Smart sessions module not activated")
    }

    const validatorParameters: ToValidatorModuleParameters = {
      account: nexusAccount,
      signer,
      meta
    }

    nexusAccount.setActiveModule(
      MODULE_HELPERS[supportedModule].func(validatorParameters)
    )
  }
}
