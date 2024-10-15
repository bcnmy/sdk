import { OWNABLE_VALIDATOR_ADDRESS } from "@rhinestone/module-sdk"
import type { LocalAccount } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { parseAccount } from "viem/accounts"
import addresses from "../../__contracts/addresses"
import {
  ERROR_MESSAGES,
  type ModularSmartAccount,
  addressEquals
} from "../../account"
import { toK1 } from "../k1/toK1"
import { toOwnables } from "../ownables/toOwnables"
import { toUseSessions } from "../smartSessions/toUseSessions"
import type { Module } from "./toModule"

type SupportedModule = "smartSession" | "ownable" | "k1"

const MODULE_ADDRESSES = {
  smartSession: addresses.SmartSession,
  ownable: OWNABLE_VALIDATOR_ADDRESS,
  k1: addresses.K1Validator
}

export const activateModule = (
  supportedModule: SupportedModule,
  account: SmartAccount | undefined,
  // biome-ignore lint/suspicious/noExplicitAny: can be data from any module
  data?: any
): Module => {
  if (!account) throw new Error(ERROR_MESSAGES.ACCOUNT_REQUIRED)
  const modularAccount = parseAccount(account) as ModularSmartAccount
  let module = modularAccount.getModule()
  if (!module) throw new Error(ERROR_MESSAGES.MODULE_NOT_ACTIVATED)
  const relevantModuleAddress = MODULE_ADDRESSES[supportedModule]

  if (!addressEquals(module.address, relevantModuleAddress)) {
    const signer = modularAccount?.client?.account as LocalAccount
    const eoaAccountAddress = signer?.address

    if (!signer || !eoaAccountAddress) {
      throw new Error(ERROR_MESSAGES.MODULE_NOT_ACTIVATED)
    }

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
          signer,
          initArgs: { threshold: 1n, owners: [eoaAccountAddress] }
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
  return module
}
