export const ERC7484RegistryAbi = [
  {
    inputs: [
      { internalType: "address", name: "smartAccount", type: "address" }
    ],
    name: "findTrustedAttesters",
    outputs: [
      { internalType: "address[]", name: "attesters", type: "address[]" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const
