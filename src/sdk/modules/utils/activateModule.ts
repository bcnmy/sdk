import { OWNABLE_VALIDATOR_ADDRESS } from "@rhinestone/module-sdk"
import type { LocalAccount } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { parseAccount } from "viem/accounts"
import addresses from "../../__contracts/addresses"
import { ERROR_MESSAGES, addressEquals } from "../../account"
import { toK1 } from "../k1/toK1"
import { toOwnables } from "../ownables/toOwnables"
import { toUseSessions } from "../smartSessions/toUseSessions"
import type { Module } from "./toValidationModule"

type SupportedModule = "smartSession" | "ownable" | "k1"

const MODULE_ADDRESSES = {
  smartSession: addresses.SmartSession,
  ownable: OWNABLE_VALIDATOR_ADDRESS,
  k1: addresses.K1Validator
}

type ModularSmartAccount = SmartAccount & {
  getModule: () => Module | undefined
  setModule: (module: Module) => void
}

export const activateModule = (
  supportedModule: SupportedModule,
  account: SmartAccount | undefined,
  // biome-ignore lint/suspicious/noExplicitAny: can be data from any module
  data?: any
) => {
  if (!account) throw new Error("Account is required")
  const modularAccount = parseAccount(account) as ModularSmartAccount
  const module = modularAccount?.getModule()
  const relevantModuleAddress = MODULE_ADDRESSES[supportedModule]

  if (module && !addressEquals(module.address, relevantModuleAddress)) {
    const signer = modularAccount?.client?.account as LocalAccount
    const eoaAccountAddress = signer?.address

    if (!signer || !eoaAccountAddress) {
      throw new Error("Module not activated")
    }

    let module: Module
    switch (supportedModule) {
      case "smartSession": {
        if (!data) throw new Error(ERROR_MESSAGES.SMART_SESSION_DATA_REQUIRED)
        module = toUseSessions({
          account: modularAccount,
          signer,
          data
        })
        break
      }

      case "ownable": {
        module = toOwnables({
          account: modularAccount,
          signer
        })
        break
      }

      default:
        module = toK1({
          accountAddress: modularAccount?.address,
          signer
        })
    }

    modularAccount.setModule(module)
  }
}
