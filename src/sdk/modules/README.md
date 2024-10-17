# Nexus SDK Modules

This README provides an overview of how to interact with modules in the Nexus SDK. Modules are designed to extend the functionality of smart contract accounts in a consistent and predictable manner.

## General Module Interaction Pattern

Interacting with a module typically follows these steps:

1. **Create the module**
2. **Install the module**
3. **Extend the Nexus client with module-specific actions**
4. **Use the module's functionality**

## Step-by-Step Guide

### 1. Create the module

Use the appropriate `to[ModuleName]` function to create a module instance:

```typescript
const myModule = to[ModuleName]({
  account: nexusClient.account,
  signer: eoaAccount,
  moduleInitArgs: {
    // Module-specific initialization arguments
  }
})
```

### 2. Install the module

Install the module on your Nexus client's smart contract account:

```typescript
const hash = await nexusClient.installModule({
  module: myModule.moduleInitData
})

// Wait for the installation to be confirmed
const { success } = await nexusClient.waitForUserOperationReceipt({ hash })
```

### 3. Extend the Nexus client

Extend your Nexus client with module-specific actions:

```typescript
const extendedNexusClient = nexusClient.extend([ModuleName]Actions(myModule))
```

### 4. Use the module's functionality

Use the extended Nexus client to interact with the module's features:

```typescript
const result = await extendedNexusClient.[moduleSpecificAction]({
  // Action-specific parameters
})
```

## Example: Smart Sessions Module

Here's an example of how to use the Smart Sessions module:

```typescript
// 1. Create the module
const sessionsModule = toSmartSessions({
  account: nexusClient.account,
  signer: eoaAccount
})

// 2. Install the module
const hash = await nexusClient.installModule({
  module: sessionsModule.moduleInitData
})
await nexusClient.waitForUserOperationReceipt({ hash })

// 3. Extend the Nexus client
const sessionNexusClient = nexusClient.extend(
  smartSessionCreateActions(sessionsModule)
)

// 4. Use the module's functionality
const createSessionsResponse = await sessionNexusClient.createSessions({
  sessionRequestedInfo: [
    // Session parameters
  ]
})
```

## Best Practices

- Always wait for transaction confirmations after installing modules or performing actions.
- Keep module-specific logic encapsulated within the module and its actions.
- Use TypeScript for better type checking and autocompletion when working with modules.

For more detailed information on specific modules, refer to their individual documentation.
