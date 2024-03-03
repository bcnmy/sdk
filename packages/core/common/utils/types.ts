import type { Address, Chain, Hex, LocalAccount } from "viem"

export type BaseValidationModule = {
  entryPointAddress: Hex
  getAddress(): Hex
  setEntryPointAddress(entryPointAddress: Hex): void
  getInitData(): Promise<Hex>
  getDummySignature(_params?: ModuleInfo): Promise<Hex>
  getSigner(): Promise<LocalAccount>
  signUserOpHash(_userOpHash: string, _params?: ModuleInfo): Promise<Hex>
  signMessage(_message: Uint8Array | string): Promise<string>
  signMessageSmartAccountSigner(
    message: string | Uint8Array,
    signer: LocalAccount
  ): Promise<string>
}

export type ModuleInfo = {
  version: 1
}

export type SmartAccountSigner<
  TSource extends string = string,
  TAddress extends Address = Address
> = Omit<LocalAccount<TSource, TAddress>, "signTransaction">

export type TChain = Chain | undefined
