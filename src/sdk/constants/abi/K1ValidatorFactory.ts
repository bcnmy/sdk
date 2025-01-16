export const K1ValidatorFactoryAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "eoaOwner",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256"
      },
      {
        internalType: "address[]",
        name: "attesters",
        type: "address[]"
      },
      {
        internalType: "uint8",
        name: "threshold",
        type: "uint8"
      }
    ],
    name: "computeAccountAddress",
    outputs: [
      {
        internalType: "address payable",
        name: "expectedAddress",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const
