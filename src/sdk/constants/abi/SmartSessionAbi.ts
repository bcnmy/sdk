export const SmartSessionAbi = [
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "AssociatedArray_OutOfBounds",
    type: "error"
  },
  {
    inputs: [
      { internalType: "uint64", name: "providedChainId", type: "uint64" }
    ],
    name: "ChainIdMismatch",
    type: "error"
  },
  {
    inputs: [
      { internalType: "uint64", name: "providedChainId", type: "uint64" }
    ],
    name: "ChainIdMismatch",
    type: "error"
  },
  { inputs: [], name: "ForbiddenValidationData", type: "error" },
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "HashIndexOutOfBounds",
    type: "error"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "providedHash", type: "bytes32" },
      { internalType: "bytes32", name: "computedHash", type: "bytes32" }
    ],
    name: "HashMismatch",
    type: "error"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "providedHash", type: "bytes32" },
      { internalType: "bytes32", name: "computedHash", type: "bytes32" }
    ],
    name: "HashMismatch",
    type: "error"
  },
  { inputs: [], name: "InvalidActionId", type: "error" },
  { inputs: [], name: "InvalidCallTarget", type: "error" },
  { inputs: [], name: "InvalidData", type: "error" },
  { inputs: [], name: "InvalidDataLength", type: "error" },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "hash", type: "bytes32" }
    ],
    name: "InvalidEnableSignature",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "contract ISessionValidator",
        name: "sessionValidator",
        type: "address"
      }
    ],
    name: "InvalidISessionValidator",
    type: "error"
  },
  { inputs: [], name: "InvalidMode", type: "error" },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    name: "InvalidPermissionId",
    type: "error"
  },
  { inputs: [], name: "InvalidSelfCall", type: "error" },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    name: "InvalidSession",
    type: "error"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address", name: "sessionValidator", type: "address" },
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "userOpHash", type: "bytes32" }
    ],
    name: "InvalidSessionKeySignature",
    type: "error"
  },
  { inputs: [], name: "InvalidTarget", type: "error" },
  {
    inputs: [{ internalType: "address", name: "sender", type: "address" }],
    name: "InvalidUserOpSender",
    type: "error"
  },
  { inputs: [], name: "NoExecutionsInBatch", type: "error" },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    name: "NoPoliciesSet",
    type: "error"
  },
  { inputs: [], name: "PartlyEnabledActions", type: "error" },
  { inputs: [], name: "PartlyEnabledPolicies", type: "error" },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    name: "PaymasterValidationNotEnabled",
    type: "error"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address", name: "policy", type: "address" }
    ],
    name: "PolicyViolation",
    type: "error"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "SignerNotFound",
    type: "error"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "SignerNotFound",
    type: "error"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "SmartSessionModuleAlreadyInstalled",
    type: "error"
  },
  { inputs: [], name: "UnsupportedExecutionType", type: "error" },
  {
    inputs: [{ internalType: "address", name: "policy", type: "address" }],
    name: "UnsupportedPolicy",
    type: "error"
  },
  {
    inputs: [{ internalType: "address", name: "policy", type: "address" }],
    name: "UnsupportedPolicy",
    type: "error"
  },
  {
    inputs: [
      { internalType: "enum SmartSessionMode", name: "mode", type: "uint8" }
    ],
    name: "UnsupportedSmartSessionMode",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "PermissionId",
        name: "permissionId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "ActionId",
        name: "actionId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "address",
        name: "smartAccount",
        type: "address"
      }
    ],
    name: "ActionIdDisabled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "PermissionId",
        name: "permissionId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newValue",
        type: "uint256"
      }
    ],
    name: "NonceIterated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "PermissionId",
        name: "permissionId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "address",
        name: "smartAccount",
        type: "address"
      },
      { indexed: false, internalType: "bool", name: "enabled", type: "bool" }
    ],
    name: "PermissionIdCanUsePaymaster",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "PermissionId",
        name: "permissionId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "enum PolicyType",
        name: "policyType",
        type: "uint8"
      },
      {
        indexed: false,
        internalType: "address",
        name: "policy",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "smartAccount",
        type: "address"
      }
    ],
    name: "PolicyDisabled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "PermissionId",
        name: "permissionId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "enum PolicyType",
        name: "policyType",
        type: "uint8"
      },
      {
        indexed: false,
        internalType: "address",
        name: "policy",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "smartAccount",
        type: "address"
      }
    ],
    name: "PolicyEnabled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "PermissionId",
        name: "permissionId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "SessionCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "PermissionId",
        name: "permissionId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "address",
        name: "smartAccount",
        type: "address"
      }
    ],
    name: "SessionRemoved",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "PermissionId",
        name: "permissionId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "address",
        name: "sessionValidator",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "smartAccount",
        type: "address"
      }
    ],
    name: "SessionValidatorDisabled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "PermissionId",
        name: "permissionId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "address",
        name: "sessionValidator",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "smartAccount",
        type: "address"
      }
    ],
    name: "SessionValidatorEnabled",
    type: "event"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address", name: "smartAccount", type: "address" }
    ],
    name: "$canUsePaymaster",
    outputs: [{ internalType: "bool", name: "canUsePaymaster", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      {
        components: [
          {
            internalType: "bytes4",
            name: "actionTargetSelector",
            type: "bytes4"
          },
          { internalType: "address", name: "actionTarget", type: "address" },
          {
            components: [
              { internalType: "address", name: "policy", type: "address" },
              { internalType: "bytes", name: "initData", type: "bytes" }
            ],
            internalType: "struct PolicyData[]",
            name: "actionPolicies",
            type: "tuple[]"
          }
        ],
        internalType: "struct ActionData[]",
        name: "actions",
        type: "tuple[]"
      }
    ],
    name: "areActionsEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      {
        components: [
          { internalType: "address", name: "policy", type: "address" },
          { internalType: "bytes", name: "initData", type: "bytes" }
        ],
        internalType: "struct PolicyData[]",
        name: "erc1271Policies",
        type: "tuple[]"
      }
    ],
    name: "areERC1271PoliciesEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      {
        components: [
          { internalType: "address", name: "policy", type: "address" },
          { internalType: "bytes", name: "initData", type: "bytes" }
        ],
        internalType: "struct PolicyData[]",
        name: "userOpPolicies",
        type: "tuple[]"
      }
    ],
    name: "areUserOpPoliciesEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "ActionId", name: "actionId", type: "bytes32" }
    ],
    name: "disableActionId",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "ActionId", name: "actionId", type: "bytes32" },
      { internalType: "address[]", name: "policies", type: "address[]" }
    ],
    name: "disableActionPolicies",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address[]", name: "policies", type: "address[]" },
      {
        components: [
          {
            internalType: "bytes32",
            name: "appDomainSeparator",
            type: "bytes32"
          },
          { internalType: "string[]", name: "contentNames", type: "string[]" }
        ],
        internalType: "struct ERC7739Context[]",
        name: "contexts",
        type: "tuple[]"
      }
    ],
    name: "disableERC1271Policies",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address[]", name: "policies", type: "address[]" }
    ],
    name: "disableUserOpPolicies",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      {
        components: [
          {
            internalType: "bytes4",
            name: "actionTargetSelector",
            type: "bytes4"
          },
          { internalType: "address", name: "actionTarget", type: "address" },
          {
            components: [
              { internalType: "address", name: "policy", type: "address" },
              { internalType: "bytes", name: "initData", type: "bytes" }
            ],
            internalType: "struct PolicyData[]",
            name: "actionPolicies",
            type: "tuple[]"
          }
        ],
        internalType: "struct ActionData[]",
        name: "actionPolicies",
        type: "tuple[]"
      }
    ],
    name: "enableActionPolicies",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      {
        components: [
          {
            components: [
              {
                internalType: "bytes32",
                name: "appDomainSeparator",
                type: "bytes32"
              },
              {
                internalType: "string[]",
                name: "contentNames",
                type: "string[]"
              }
            ],
            internalType: "struct ERC7739Context[]",
            name: "allowedERC7739Content",
            type: "tuple[]"
          },
          {
            components: [
              { internalType: "address", name: "policy", type: "address" },
              { internalType: "bytes", name: "initData", type: "bytes" }
            ],
            internalType: "struct PolicyData[]",
            name: "erc1271Policies",
            type: "tuple[]"
          }
        ],
        internalType: "struct ERC7739Data",
        name: "erc1271Policies",
        type: "tuple"
      }
    ],
    name: "enableERC1271Policies",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "contract ISessionValidator",
            name: "sessionValidator",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "sessionValidatorInitData",
            type: "bytes"
          },
          { internalType: "bytes32", name: "salt", type: "bytes32" },
          {
            components: [
              { internalType: "address", name: "policy", type: "address" },
              { internalType: "bytes", name: "initData", type: "bytes" }
            ],
            internalType: "struct PolicyData[]",
            name: "userOpPolicies",
            type: "tuple[]"
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: "bytes32",
                    name: "appDomainSeparator",
                    type: "bytes32"
                  },
                  {
                    internalType: "string[]",
                    name: "contentNames",
                    type: "string[]"
                  }
                ],
                internalType: "struct ERC7739Context[]",
                name: "allowedERC7739Content",
                type: "tuple[]"
              },
              {
                components: [
                  { internalType: "address", name: "policy", type: "address" },
                  { internalType: "bytes", name: "initData", type: "bytes" }
                ],
                internalType: "struct PolicyData[]",
                name: "erc1271Policies",
                type: "tuple[]"
              }
            ],
            internalType: "struct ERC7739Data",
            name: "erc7739Policies",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "bytes4",
                name: "actionTargetSelector",
                type: "bytes4"
              },
              {
                internalType: "address",
                name: "actionTarget",
                type: "address"
              },
              {
                components: [
                  { internalType: "address", name: "policy", type: "address" },
                  { internalType: "bytes", name: "initData", type: "bytes" }
                ],
                internalType: "struct PolicyData[]",
                name: "actionPolicies",
                type: "tuple[]"
              }
            ],
            internalType: "struct ActionData[]",
            name: "actions",
            type: "tuple[]"
          },
          { internalType: "bool", name: "canUsePaymaster", type: "bool" }
        ],
        internalType: "struct Session[]",
        name: "sessions",
        type: "tuple[]"
      }
    ],
    name: "enableSessions",
    outputs: [
      {
        internalType: "PermissionId[]",
        name: "permissionIds",
        type: "bytes32[]"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      {
        components: [
          { internalType: "address", name: "policy", type: "address" },
          { internalType: "bytes", name: "initData", type: "bytes" }
        ],
        internalType: "struct PolicyData[]",
        name: "userOpPolicies",
        type: "tuple[]"
      }
    ],
    name: "enableUserOpPolicies",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "ActionId", name: "actionId", type: "bytes32" }
    ],
    name: "getActionPolicies",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    name: "getERC1271Policies",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    name: "getEnabledActions",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    name: "getEnabledERC7739Content",
    outputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "appDomainSeparator",
            type: "bytes32"
          },
          {
            internalType: "bytes32[]",
            name: "contentNameHashes",
            type: "bytes32[]"
          }
        ],
        internalType: "struct ERC7739ContextHashes[]",
        name: "enabledERC7739ContentHashes",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "getNonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getPermissionIDs",
    outputs: [
      {
        internalType: "PermissionId[]",
        name: "permissionIds",
        type: "bytes32[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "contract ISessionValidator",
            name: "sessionValidator",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "sessionValidatorInitData",
            type: "bytes"
          },
          { internalType: "bytes32", name: "salt", type: "bytes32" },
          {
            components: [
              { internalType: "address", name: "policy", type: "address" },
              { internalType: "bytes", name: "initData", type: "bytes" }
            ],
            internalType: "struct PolicyData[]",
            name: "userOpPolicies",
            type: "tuple[]"
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: "bytes32",
                    name: "appDomainSeparator",
                    type: "bytes32"
                  },
                  {
                    internalType: "string[]",
                    name: "contentNames",
                    type: "string[]"
                  }
                ],
                internalType: "struct ERC7739Context[]",
                name: "allowedERC7739Content",
                type: "tuple[]"
              },
              {
                components: [
                  { internalType: "address", name: "policy", type: "address" },
                  { internalType: "bytes", name: "initData", type: "bytes" }
                ],
                internalType: "struct PolicyData[]",
                name: "erc1271Policies",
                type: "tuple[]"
              }
            ],
            internalType: "struct ERC7739Data",
            name: "erc7739Policies",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "bytes4",
                name: "actionTargetSelector",
                type: "bytes4"
              },
              {
                internalType: "address",
                name: "actionTarget",
                type: "address"
              },
              {
                components: [
                  { internalType: "address", name: "policy", type: "address" },
                  { internalType: "bytes", name: "initData", type: "bytes" }
                ],
                internalType: "struct PolicyData[]",
                name: "actionPolicies",
                type: "tuple[]"
              }
            ],
            internalType: "struct ActionData[]",
            name: "actions",
            type: "tuple[]"
          },
          { internalType: "bool", name: "canUsePaymaster", type: "bool" }
        ],
        internalType: "struct Session",
        name: "session",
        type: "tuple"
      }
    ],
    name: "getPermissionId",
    outputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
      {
        components: [
          {
            internalType: "contract ISessionValidator",
            name: "sessionValidator",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "sessionValidatorInitData",
            type: "bytes"
          },
          { internalType: "bytes32", name: "salt", type: "bytes32" },
          {
            components: [
              { internalType: "address", name: "policy", type: "address" },
              { internalType: "bytes", name: "initData", type: "bytes" }
            ],
            internalType: "struct PolicyData[]",
            name: "userOpPolicies",
            type: "tuple[]"
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: "bytes32",
                    name: "appDomainSeparator",
                    type: "bytes32"
                  },
                  {
                    internalType: "string[]",
                    name: "contentNames",
                    type: "string[]"
                  }
                ],
                internalType: "struct ERC7739Context[]",
                name: "allowedERC7739Content",
                type: "tuple[]"
              },
              {
                components: [
                  { internalType: "address", name: "policy", type: "address" },
                  { internalType: "bytes", name: "initData", type: "bytes" }
                ],
                internalType: "struct PolicyData[]",
                name: "erc1271Policies",
                type: "tuple[]"
              }
            ],
            internalType: "struct ERC7739Data",
            name: "erc7739Policies",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "bytes4",
                name: "actionTargetSelector",
                type: "bytes4"
              },
              {
                internalType: "address",
                name: "actionTarget",
                type: "address"
              },
              {
                components: [
                  { internalType: "address", name: "policy", type: "address" },
                  { internalType: "bytes", name: "initData", type: "bytes" }
                ],
                internalType: "struct PolicyData[]",
                name: "actionPolicies",
                type: "tuple[]"
              }
            ],
            internalType: "struct ActionData[]",
            name: "actions",
            type: "tuple[]"
          },
          { internalType: "bool", name: "canUsePaymaster", type: "bool" }
        ],
        internalType: "struct Session",
        name: "data",
        type: "tuple"
      },
      { internalType: "enum SmartSessionMode", name: "mode", type: "uint8" }
    ],
    name: "getSessionDigest",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    name: "getSessionValidatorAndConfig",
    outputs: [
      { internalType: "address", name: "sessionValidator", type: "address" },
      { internalType: "bytes", name: "sessionValidatorData", type: "bytes" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    name: "getUserOpPolicies",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "ActionId", name: "actionId", type: "bytes32" }
    ],
    name: "isActionIdEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "ActionId", name: "actionId", type: "bytes32" },
      { internalType: "address", name: "policy", type: "address" }
    ],
    name: "isActionPolicyEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address", name: "policy", type: "address" }
    ],
    name: "isERC1271PolicyEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "bytes32", name: "appDomainSeparator", type: "bytes32" },
      { internalType: "string", name: "content", type: "string" }
    ],
    name: "isERC7739ContentEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "isISessionValidatorSet",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "smartAccount", type: "address" }
    ],
    name: "isInitialized",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "typeID", type: "uint256" }],
    name: "isModuleType",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "isPermissionEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "address", name: "policy", type: "address" }
    ],
    name: "isUserOpPolicyEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "bytes32", name: "hash", type: "bytes32" },
      { internalType: "bytes", name: "signature", type: "bytes" }
    ],
    name: "isValidSignatureWithSender",
    outputs: [{ internalType: "bytes4", name: "result", type: "bytes4" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes", name: "data", type: "bytes" }],
    name: "onInstall",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    name: "onUninstall",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    name: "removeSession",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" }
    ],
    name: "revokeEnableSignature",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "PermissionId", name: "permissionId", type: "bytes32" },
      { internalType: "bool", name: "enabled", type: "bool" }
    ],
    name: "setCanUsePaymaster",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "uint256", name: "nonce", type: "uint256" },
          { internalType: "bytes", name: "initCode", type: "bytes" },
          { internalType: "bytes", name: "callData", type: "bytes" },
          {
            internalType: "bytes32",
            name: "accountGasLimits",
            type: "bytes32"
          },
          {
            internalType: "uint256",
            name: "preVerificationGas",
            type: "uint256"
          },
          { internalType: "bytes32", name: "gasFees", type: "bytes32" },
          { internalType: "bytes", name: "paymasterAndData", type: "bytes" },
          { internalType: "bytes", name: "signature", type: "bytes" }
        ],
        internalType: "struct PackedUserOperation",
        name: "userOp",
        type: "tuple"
      },
      { internalType: "bytes32", name: "userOpHash", type: "bytes32" }
    ],
    name: "validateUserOp",
    outputs: [{ internalType: "ValidationData", name: "vd", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  }
]
