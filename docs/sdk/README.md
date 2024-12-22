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
  baseUrl: 'YOUR_API_URL', // e.g., 'http://localhost:3000'
});

// After login, set the access token
client.setAccessToken(accessToken);

// Use the client
async function example() {
  try {
    // Login
    const authResponse = await client.auth.login({
      email: 'user@example.com',
      password: 'password'
    });
    
    // Set the access token after login
    client.setAccessToken(authResponse.access_token);
    
    // Now you can make authenticated requests
    const result = await client.permissions.getPermissionDashboard();
    console.log(result);
  } catch (error) {
    console.error('API Error:', error);
  }
}

// Token refresh example
async function refreshExample() {
  try {
    const refreshResponse = await client.auth.refresh({
      refresh_token: 'your-refresh-token'
    });
    
    // Update the access token after refresh
    client.setAccessToken(refreshResponse.access_token);
  } catch (error) {
    console.error('Refresh Error:', error);
  }
}
```

### Token Management Best Practices

1. **Access Token Storage**
   - Store in memory (e.g., Redux store, React state)
   - Never store in localStorage/sessionStorage
   - Clear on logout/window close

2. **Refresh Token Storage**
   - Store in HTTP-only cookie (handled by backend)
   - Never store in client-side JavaScript
   - Used only for token refresh

3. **Token Refresh Strategy**
   - Implement automatic refresh before expiry
   - Handle 401 responses with refresh attempt
   - Clear tokens and redirect to login on refresh failure

4. **Security Considerations**
   - Use HTTPS only
   - Implement proper CORS
   - Clear tokens on logout
   - Handle token expiration gracefully

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

4. **Authentication**
   - Follow token management best practices
   - Implement proper error handling
   - Use automatic token refresh
   - Clear tokens on logout