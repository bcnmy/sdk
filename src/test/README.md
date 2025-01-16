# @biconomy/sdk Testing Framework

## Testing Setup

> **Note**:  
> - Tests now must be run with node version >= v22

### Network Agnostic Tests
- Tests are executed against locally deployed ephemeral Anvil chains (each with a different ID) with relevant contracts pre-deployed for each test.
- Bundlers for testing are instantiated using [prool](https://github.com/wevm/prool), currently utilizing alto instances. We plan to switch to Biconomy's bundlers when they become available via `prool`.

### Global Scope
- Use by setting `const NETWORK_TYPE: TestFileNetworkType = "COMMUNAL_ANVIL_NETWORK"` at the top of the test file.
- Suitable when you're sure that tests in the file will **not** conflict with other tests using the common localhost network.

### Local Scope
- Use by setting `const NETWORK_TYPE: TestFileNetworkType = "BESPOKE_ANVIL_NETWORK"` for test files that may conflict with others.
- Networks scoped locally are isolated to the file in which they are used.
- Tests within the same file using a local network may conflict with each other. If needed, split tests into separate files or use the Test Scope.
- `"BESPOKE_ANVIL_NETWORK_FORKING_BASE_SEPOLIA"` does a similar thing, but anvil assumes the current state of base sepolia instead. Overusing this can cause throttling issues from tenderly or the service that you are finding the forkUrl from. 

### Testnet Scope
- Use by setting `const NETWORK_TYPE: TestFileNetworkType = "TESTNET_FROM_ENV_VARS"` for test files that rely on the network, private key and bundler url specified in your env vars.
- `"MAINNET_FROM_ENV_VARS"` is also available, which uses alternative env vars which you've specified.
- Networks scoped to a testnet are not isolated to the file in which they are used, they require tesnet tokens, can often fail for gas reasons, and they will add additional latency to tests. 
- Avoid overusing this option

> **Note:** 
> As testnetTest runs against a public testnet the account related to the privatekey (in your env var) must be funded, and the testnet is not 'ephemeral', meaning state is obviously persisted on the testnet after the test finishes. 

- The playground does not run in CI/CD but can be triggered manually from the GitHub Actions UI or locally via bun run playground.
- The playground network is configured with environment variables:
    - PRIVATE_KEY
    - CHAIN_ID
    - RPC_URL (optional, inferred if unset)
    - BUNDLER_URL (optional, inferred if unset)
    - PAYMASTER_URL (tests skipped if unset)

## Debugging and Client Issues
It is recommended to use the playground for debugging issues with clients. Please refer to the following guidelines for escalation and handover: [Debugging Client Issues](https://www.notion.so/biconomy/Debugging-Client-Issues-cc01c1cab0224c87b37a4d283370165b)

## Testing Helpers
A [testClient](https://viem.sh/docs/clients/test#extending-with-public--wallet-actions) is available (funded and extended with walletActions and publicActions) during testing. Please use it as a master Client for all things network related. 

