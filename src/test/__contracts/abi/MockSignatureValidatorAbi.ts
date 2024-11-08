export const MockSignatureValidatorAbi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "hash",
        type: "bytes32"
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes"
      },
      {
        internalType: "address",
        name: "signer",
        type: "address"
      }
    ],
    name: "verify",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const
