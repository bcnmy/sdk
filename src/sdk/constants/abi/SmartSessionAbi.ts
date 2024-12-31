export const SmartSessionAbi = [
  {
    type: "function",
    name: "enableSessions",
    inputs: [
      {
        name: "sessions",
        type: "tuple[]",
        internalType: "struct Session[]",
        components: [
          {
            name: "sessionValidator",
            type: "address",
            internalType: "contract ISessionValidator"
          },
          {
            name: "sessionValidatorInitData",
            type: "bytes",
            internalType: "bytes"
          },
          { name: "salt", type: "bytes32", internalType: "bytes32" },
          {
            name: "userOpPolicies",
            type: "tuple[]",
            internalType: "struct PolicyData[]",
            components: [
              { name: "policy", type: "address", internalType: "address" },
              { name: "initData", type: "bytes", internalType: "bytes" }
            ]
          },
          {
            name: "erc7739Policies",
            type: "tuple",
            internalType: "struct ERC7739Data",
            components: [
              {
                name: "allowedERC7739Content",
                type: "string[]",
                internalType: "string[]"
              },
              {
                name: "erc1271Policies",
                type: "tuple[]",
                internalType: "struct PolicyData[]",
                components: [
                  { name: "policy", type: "address", internalType: "address" },
                  { name: "initData", type: "bytes", internalType: "bytes" }
                ]
              }
            ]
          },
          {
            name: "actions",
            type: "tuple[]",
            internalType: "struct ActionData[]",
            components: [
              {
                name: "actionTargetSelector",
                type: "bytes4",
                internalType: "bytes4"
              },
              {
                name: "actionTarget",
                type: "address",
                internalType: "address"
              },
              {
                name: "actionPolicies",
                type: "tuple[]",
                internalType: "struct PolicyData[]",
                components: [
                  { name: "policy", type: "address", internalType: "address" },
                  { name: "initData", type: "bytes", internalType: "bytes" }
                ]
              }
            ]
          }
        ]
      }
    ],
    outputs: [
      {
        name: "permissionIds",
        type: "bytes32[]",
        internalType: "PermissionId[]"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getPermissionId",
    inputs: [
      {
        name: "session",
        type: "tuple",
        internalType: "struct Session",
        components: [
          {
            name: "sessionValidator",
            type: "address",
            internalType: "contract ISessionValidator"
          },
          {
            name: "sessionValidatorInitData",
            type: "bytes",
            internalType: "bytes"
          },
          { name: "salt", type: "bytes32", internalType: "bytes32" },
          {
            name: "userOpPolicies",
            type: "tuple[]",
            internalType: "struct PolicyData[]",
            components: [
              { name: "policy", type: "address", internalType: "address" },
              { name: "initData", type: "bytes", internalType: "bytes" }
            ]
          },
          {
            name: "erc7739Policies",
            type: "tuple",
            internalType: "struct ERC7739Data",
            components: [
              {
                name: "allowedERC7739Content",
                type: "string[]",
                internalType: "string[]"
              },
              {
                name: "erc1271Policies",
                type: "tuple[]",
                internalType: "struct PolicyData[]",
                components: [
                  { name: "policy", type: "address", internalType: "address" },
                  { name: "initData", type: "bytes", internalType: "bytes" }
                ]
              }
            ]
          },
          {
            name: "actions",
            type: "tuple[]",
            internalType: "struct ActionData[]",
            components: [
              {
                name: "actionTargetSelector",
                type: "bytes4",
                internalType: "bytes4"
              },
              {
                name: "actionTarget",
                type: "address",
                internalType: "address"
              },
              {
                name: "actionPolicies",
                type: "tuple[]",
                internalType: "struct PolicyData[]",
                components: [
                  { name: "policy", type: "address", internalType: "address" },
                  { name: "initData", type: "bytes", internalType: "bytes" }
                ]
              }
            ]
          }
        ]
      }
    ],
    outputs: [
      { name: "permissionId", type: "bytes32", internalType: "PermissionId" }
    ],
    stateMutability: "pure"
  },
  {
    type: "function",
    name: "isPermissionEnabled",
    inputs: [
      { name: "permissionId", type: "bytes32", internalType: "PermissionId" },
      { name: "account", type: "address", internalType: "address" }
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view"
  }
]
