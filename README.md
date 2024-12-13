[![Biconomy](https://img.shields.io/badge/Made_with_%F0%9F%8D%8A_by-Biconomy-ff4e17?style=flat)](https://biconomy.io) [![License MIT](https://img.shields.io/badge/License-MIT-blue?&style=flat)](./LICENSE) [![codecov](https://codecov.io/github/bcnmy/sdk/graph/badge.svg?token=DTdIR5aBDA)](https://codecov.io/github/bcnmy/sdk)

# SDK 🚀

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bcnmy/sdk)

The Biconomy SDK is your all-in-one toolkit for building decentralized applications (dApps) with **ERC4337 Account Abstraction** and **Smart Accounts**. It is designed for seamless user experiences and offers non-custodial solutions for user onboarding, sending transactions (userOps), gas sponsorship and much more.

## 📚 Table of Contents

- [SDK 🚀](#sdk-)

  - [📚 Table of Contents](#-table-of-contents)
  - [🛠️ Quickstart](#-quickstart)

    - [Prerequisites](#prerequisites)
    - [Installation](#installation)

  - [📄 Documentation and Resources](#-documentation-and-resources)
  - [💼 Examples](#-examples)
  - [License](#license)
  - [Connect with Biconomy 🍊](#connect-with-biconomy-🍊)

## 🛠️ Quickstart

### Installation

1. **Add the package:**
```bash
bun add @biconomy/sdk viem @rhinestone/module-sdk
```

2. **Basic Usage:**
```typescript
import { createNexusClient } from "@biconomy/sdk";
import { http } from "viem";

const nexusClient = await createNexusClient({
  signer: account,
  chain,
  transport: http(),
  bundlerTransport: http(bundlerUrl),
});

const hash = await nexusClient.sendTransaction({ 
  calls: [{ to: "0x...", value: 1 }] 
});

const { status, transactionHash } = await nexusClient.waitForTransactionReceipt({ hash });
```

### Testing

**Prerequisites:**
- Node.js v22 or higher
- [Bun](https://bun.sh/) package manager
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

**Setup:**
```bash
bun install --frozen-lockfile
```

**Running Tests:**
```bash
# Run all tests
bun run test

# Run tests for a specific module
bun run test -t=smartSessions
```

For detailed information about the testing framework, network configurations, and debugging guidelines, please refer to our [Testing Documentation](./src/test/README.md).

## Documentation and Resources

For a comprehensive understanding of our project and to contribute effectively, please refer to the following resources:

- [**Biconomy Documentation**](https://docs.biconomy.io)
- [**Biconomy Dashboard**](https://dashboard.biconomy.io)
- [**API Documentation**](https://bcnmy.github.io/sdk)
- [**Contributing Guidelines**](./CONTRIBUTING.md): Learn how to contribute to our project, from code contributions to documentation improvements.
- [**Code of Conduct**](./CODE_OF_CONDUCT.md): Our commitment to fostering an open and welcoming environment.
- [**Security Policy**](./SECURITY.md): Guidelines for reporting security vulnerabilities.
- [**Changelog**](./CHANGELOG.md): Stay updated with the changes and versions

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details

## Connect with Biconomy 🍊

[![Website](https://img.shields.io/badge/🍊-Website-ff4e17?style=for-the-badge&logoColor=white)](https://biconomy.io) [![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/biconomy) [![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/biconomy) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/biconomy) [![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/biconomy) [![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/channel/UC0CtA-Dw9yg-ENgav_VYjRw) [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/bcnmy/)
