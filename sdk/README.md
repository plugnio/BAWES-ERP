# BAWES ERP API SDK

TypeScript SDK for interacting with the BAWES ERP API. This SDK is automatically generated from our OpenAPI specification.

## Installation

Since this is a private repository, you'll need to have access to the repository and authenticate with GitHub:

1. **GitHub Authentication**
   - Ensure you have SSH access configured for GitHub, or
   - Use a Personal Access Token (PAT) for HTTPS

2. **Install the package**
   ```bash
   # Using SSH
   npm install git+ssh://git@github.com/plugnio/BAWES-ERP-sdk.git#main

   # Using HTTPS with PAT
   npm install git+https://${GITHUB_PAT}@github.com/plugnio/BAWES-ERP-sdk.git#main

   # Install specific version (recommended)
   npm install git+ssh://git@github.com/plugnio/BAWES-ERP-sdk.git#v1.0.0
   ```

   Add to your `package.json`:
   ```json
   {
     "dependencies": {
       "@bawes/erp-api-sdk": "git+ssh://git@github.com/plugnio/BAWES-ERP-sdk.git#v1.0.0"
     }
   }
   ```

## Usage

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
    // Example API call
    const result = await client.someEndpoint();
    console.log(result);
  } catch (error) {
    console.error('API Error:', error);
  }
}
```

## Features

- Full TypeScript support with complete type definitions
- Automatic request/response handling
- Error handling with typed error responses
- Built-in retry mechanism for failed requests

## SDK Update Process

The SDK is automatically updated through our CI/CD pipeline. Here's how it works:

### Triggers
The SDK update process is triggered when:
1. Changes are made to `swagger.json` in the main repository
2. Changes are made to TypeScript files in `src/**/*.ts`
3. Manual trigger via GitHub Actions UI

### Update Process Flow

1. **Breaking Changes Check**
   - System compares the current API spec with the previous version
   - Uses `openapi-diff` to detect breaking changes
   - If breaking changes are found:
     - Creates a GitHub issue with details
     - Labels it as 'breaking-change'
     - Proceeds with update process

2. **Version Management**
   - Automatically determines version bump based on changes:
     - Breaking changes → Major version bump (1.0.0 → 2.0.0)
     - Non-breaking changes → Minor version bump (1.0.0 → 1.1.0)
   - Updates CHANGELOG.md automatically
   - Creates git tags for each version

3. **SDK Generation**
   - Generates TypeScript code from OpenAPI spec
   - Updates SDK repository with new code
   - Builds the package
   - Creates a new git tag for the version

### Documentation Updates
- CHANGELOG.md is automatically updated with each release
- Breaking changes are documented in GitHub issues
- Version history is maintained through git tags

## Version Control

This SDK follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes (automatically bumped)
- **MINOR**: New features, no breaking changes (automatically bumped)
- **PATCH**: Bug fixes (manual releases only)

### Breaking Changes

When breaking changes are detected:
1. A GitHub issue is created automatically
2. The issue contains:
   - Detailed description of the breaking changes
   - API differences
   - Required version bump information
3. The SDK version is automatically bumped to the next major version

## Contributing

This SDK is automatically generated from our OpenAPI specification. To contribute:

1. **API Changes**
   - Make changes to the API in the main BAWES-ERP repository
   - Update the OpenAPI specification (`swagger.json`)
   - Push changes to main branch
   - SDK will update automatically

2. **Manual Updates**
   - Go to GitHub Actions
   - Find "Update SDK" workflow
   - Click "Run workflow"
   - Select branch (usually main)

3. **Monitoring Updates**
   - Check GitHub Actions for build status
   - Review created issues for breaking changes
   - Verify CHANGELOG.md for update details

## Troubleshooting

### Common Issues

1. **Installation Problems**
   - Verify you have access to the repository
   - Check your SSH keys or PAT are properly configured
   - Try using HTTPS installation if SSH fails
   - Make sure you're using the correct version tag

2. **SDK Not Updating**
   - Verify changes were made to tracked files (`swagger.json` or `src/**/*.ts`)
   - Check GitHub Actions logs for errors
   - Try manual workflow trigger

3. **Breaking Changes**
   - Review GitHub issues for breaking change notifications
   - Check CHANGELOG.md for version history
   - Verify API compatibility in your application

### Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue in the main BAWES-ERP repository
3. Include relevant error messages and reproduction steps

## Breaking Changes Guide

### What Qualifies as a Breaking Change?

Breaking changes are modifications that can break existing client applications. Examples include:

1. **Endpoint Changes**
   - Removing or renaming an endpoint
   - Changing HTTP method (e.g., GET → POST)
   - Changing the URL structure

2. **Request Changes**
   - Adding new required parameters
   - Removing existing parameters
   - Changing parameter types
   - Changing parameter names

3. **Response Changes**
   - Removing fields from response
   - Changing field types
   - Renaming fields
   - Restructuring response format

4. **Authentication Changes**
   - Changing authentication method
   - Adding new required headers

### Handling Breaking Changes

When you make API changes that are detected as breaking:

1. **Review the Change**
   - The GitHub Action will automatically detect breaking changes
   - It will create a major version bump (e.g., 1.2.3 → 2.0.0)
   - Review the automated diff in the GitHub Action logs

2. **Communication**
   - Document the breaking changes in your API changelog
   - Notify all API consumers about the upcoming changes
   - Provide migration guides if needed
   - Consider maintaining the old endpoint temporarily

3. **Best Practices**
   - Version your API endpoints (e.g., /v1/users, /v2/users)
   - Maintain backwards compatibility when possible
   - Consider deprecation periods for major changes

### Example Breaking Changes

```typescript
// Breaking Change: Changing response structure
// Before
{
  "user": {
    "name": "John",
    "email": "john@example.com"
  }
}

// After (Breaking!)
{
  "userData": {  // Changed key name
    "fullName": "John",  // Changed field name
    "email": "john@example.com"
  }
}

// Breaking Change: Adding required parameter
// Before
POST /api/users
{ "name": "John" }

// After (Breaking!)
POST /api/users
{ 
  "name": "John",
  "role": "user"  // New required field
}

// Non-Breaking Change: Adding optional parameter
POST /api/users
{ 
  "name": "John",
  "title?: "Mr"  // Optional field
}
```

### Migration Strategy

When breaking changes are necessary:

1. **Plan the Change**
   - Document all breaking changes
   - Create a migration guide
   - Set a timeline for deprecation

2. **Implementation**
   - Create new endpoints/versions if needed
   - Maintain old endpoints during transition
   - Add deprecation warnings to old endpoints

3. **Testing**
   - Test both old and new endpoints
   - Verify backward compatibility where maintained
   - Test migration paths

4. **Deployment**
   - Deploy changes that auto-bump major version
   - Monitor for any issues
   - Be prepared to rollback if needed
