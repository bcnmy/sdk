export const MockCalleeAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "addrParam",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "uintParam",
        type: "uint256"
      },
      {
        internalType: "bytes32",
        name: "bytesParam",
        type: "bytes32"
      }
    ],
    name: "addBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "bals",
    outputs: [
      {
        internalType: "uint256",
        name: "uintBalance",
        type: "uint256"
      },
      {
        internalType: "bytes32",
        name: "bytes32Balance",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const
