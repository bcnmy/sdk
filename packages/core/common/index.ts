export {
  walletClientToSmartAccountSigner,
  isSmartAccountDeployed
} from "./utils/helpers.js"

export { getNonce } from "./actions/getNonce.js"

export type {
  UserOperationStruct,
  TChain,
  SmartAccountSigner,
  ENTRYPOINT_ADDRESS_V07_TYPE,
  Transaction
} from "./utils/types.js"

export {
  DEFAULT_BATCHED_SESSION_ROUTER_MODULE,
  DEFAULT_BICONOMY_FACTORY_ADDRESS,
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
  DEFAULT_ENTRYPOINT_ADDRESS,
  DEFAULT_MULTICHAIN_MODULE,
  DEFAULT_SESSION_KEY_MANAGER_MODULE,
  BICONOMY_PROXY_CREATION_CODE,
  DEFAULT_ERC20_MODULE,
  ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION,
  SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION,
  BATCHED_SESSION_ROUTER_MODULE_ADDRESSES_BY_VERSION,
  MULTICHAIN_VALIDATION_MODULE_ADDRESSES_BY_VERSION,
  ERC20_ABI,
  ACCOUNT_V2_0_LOGIC
} from "./utils/constants.js"

export {
  BiconomyInitAbi,
  BiconomyFactoryAbi,
  BiconomyExecuteAbi
} from "./utils/abis.js"

export { SignTransactionNotSupportedBySmartAccount } from "./utils/errors.js"
