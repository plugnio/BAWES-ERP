# SDK Documentation

Welcome to the BAWES ERP SDK documentation. Our SDK provides a TypeScript interface for interacting with the BAWES ERP API.

## Quick Start

### Installation

```bash
# Using SSH (recommended)
npm install git+ssh://git@github.com/plugnio/BAWES-ERP-sdk.git#v1.0.0  # specific version
npm install git+ssh://git@github.com/plugnio/BAWES-ERP-sdk.git#main    # latest version

# Using HTTPS with PAT
npm install git+https://${GITHUB_PAT}@github.com/plugnio/BAWES-ERP-sdk.git#v1.0.0  # specific version
npm install git+https://${GITHUB_PAT}@github.com/plugnio/BAWES-ERP-sdk.git#main    # latest version
```

### Package.json Configuration

Add the following to your `package.json`:

For a specific version (recommended for production):
```json
{
  "dependencies": {
    "@bawes/erp-api-sdk": "git+ssh://git@github.com/plugnio/BAWES-ERP-sdk.git#v1.0.0"
  }
}
```

For the latest version (use with caution, mainly for development):
```json
{
  "dependencies": {
    "@bawes/erp-api-sdk": "git+ssh://git@github.com/plugnio/BAWES-ERP-sdk.git#main"
  }
}
```

For HTTPS with Personal Access Token (PAT):
```json
{
  "dependencies": {
    "@bawes/erp-api-sdk": "git+https://${GITHUB_PAT}@github.com/plugnio/BAWES-ERP-sdk.git#v1.0.0"  // or #main for latest
  }
}
```

Then run:
```bash
npm install
```

### Version Management

The version tag (e.g., `#v1.0.0`) follows semantic versioning:
- `v1.0.0`: Major.Minor.Patch
  - Major: Breaking changes
  - Minor: New features (backward compatible)
  - Patch: Bug fixes

To update to a newer version:
1. Check the [SDK repository's changelog](https://github.com/plugnio/BAWES-ERP-sdk/blob/main/CHANGELOG.md) for breaking changes
2. Update the version tag in your package.json
3. Run `npm install`

```bash
# Update to latest version
npm install git+ssh://git@github.com/plugnio/BAWES-ERP-sdk.git#main

# Update to specific version
npm install git+ssh://git@github.com/plugnio/BAWES-ERP-sdk.git#v1.1.0
```

**Note:** Using `#main` will always pull the latest version, which may include breaking changes. For production environments, we recommend using a specific version tag.

### Basic Usage

```typescript
import { BawesErpClient } from '@bawes/erp-api-sdk';

// Initialize the client
const client = new BawesErpClient({
  baseUrl: 'YOUR_API_URL',
  apiKey: 'YOUR_API_KEY'
});

// Use the client
async function example() {
  try {
    const result = await client.someEndpoint();
    console.log(result);
  } catch (error) {
    console.error('API Error:', error);
  }
}
```

## Features

- Full TypeScript support
- Automatic request/response handling
- Type-safe API calls
- Error handling with typed responses
- Built-in retry mechanism

## Automatic Updates

The SDK is automatically updated when:
1. API changes are pushed to main branch
2. Breaking changes are detected
3. Manual updates are triggered

### Update Process

1. **Change Detection**
   - Monitors `swagger.json` and TypeScript files
   - Triggers on push to main
   - Can be manually triggered

2. **Version Management**
   - Breaking changes → Major version
   - New features → Minor version
   - Bug fixes → Patch version

3. **Documentation**
   - CHANGELOG.md is auto-updated
   - Breaking changes are documented
   - Version tags are created

## Best Practices

1. **Installation**
   - Always specify exact version
   - Use SSH for private repository
   - Keep dependencies up to date

2. **Usage**
   - Initialize client once
   - Reuse client instance
   - Handle errors properly
   - Use TypeScript for type safety

3. **Version Control**
   - Monitor version tags
   - Review breaking changes
   - Test before upgrading