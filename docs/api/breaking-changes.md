# Breaking Changes Guide

## Overview

Breaking changes in the BAWES ERP API are automatically detected and handled through our CI/CD pipeline. This guide explains what constitutes a breaking change, how they're detected, and how to handle them.

## What is a Breaking Change?

A breaking change is any modification that could cause existing client applications to stop working. These are automatically detected by comparing the current and previous OpenAPI specifications.

### Common Breaking Changes

1. **Endpoint Changes**
   ```diff
   - GET /api/users/{id}
   + GET /api/users/get/{id}    # Breaking: URL structure changed
   ```
   - Removing endpoints
   - Changing HTTP methods
   - Modifying URL structure
   - Adding required path parameters

2. **Request Changes**
   ```typescript
   // Before
   interface CreateUserRequest {
     name: string;
   }

   // After (Breaking!)
   interface CreateUserRequest {
     name: string;
     role: string;  // Breaking: New required field
   }
   ```
   - Adding required fields
   - Removing fields
   - Changing field types
   - Renaming fields

3. **Response Changes**
   ```typescript
   // Before
   interface UserResponse {
     user: {
       name: string;
       email: string;
     }
   }

   // After (Breaking!)
   interface UserResponse {
     userData: {  // Breaking: Structure changed
       fullName: string;  // Breaking: Field renamed
       email: string;
     }
   }
   ```
   - Removing fields
   - Changing field types
   - Renaming fields
   - Restructuring response format

## Automated Detection

Breaking changes are automatically detected when:
1. Changes are pushed to main branch
2. The application generates new OpenAPI spec
3. GitHub Action compares specs and detects changes

```bash
# The check is run automatically, but can be triggered manually
npm run check:breaking-changes
```

## Version Management

### Automatic Version Bumping
- Breaking changes → Major version (1.0.0 → 2.0.0)
- New features → Minor version (1.0.0 → 1.1.0)
- Bug fixes → Patch version (1.0.0 → 1.0.1)

### Version Tags
```bash
# List all versions
git tag -l

# Get specific version
git checkout v1.0.0
```

## Best Practices

### Avoiding Breaking Changes
1. Add new fields as optional
   ```typescript
   interface UserResponse {
     name: string;
     email: string;
     role?: string;  // New optional field (non-breaking)
   }
   ```

2. Version your endpoints
   ```typescript
   @Controller('api/v1/users')  // Old version
   export class UsersV1Controller {}

   @Controller('api/v2/users')  // New version
   export class UsersV2Controller {}
   ```

3. Use deprecation notices
   ```typescript
   @ApiDeprecated({ message: 'Use /api/v2/users instead' })
   @Get('/api/v1/users')
   ```

### When Breaking Changes are Necessary

1. **Documentation**
   - Document the changes clearly
   - Provide migration guides
   - Update examples

2. **Communication**
   - Notify API consumers
   - Provide timeline for changes
   - Offer support for migration

3. **Testing**
   - Test both old and new versions
   - Verify breaking changes
   - Test migration paths

## Migration Strategy

### For API Providers
1. Plan the change
   - Document breaking changes
   - Create migration guide
   - Set timeline

2. Implementation
   - Create new endpoint version
   - Maintain old version temporarily
   - Add deprecation warnings

3. Deployment
   - Deploy with version bump
   - Monitor for issues
   - Support migration

### For API Consumers
1. Monitor version tags
2. Review breaking changes
3. Test against new version
4. Update implementation
5. Deploy updates

## Examples

### Non-Breaking Changes
```typescript
// Adding optional fields
interface User {
  name: string;
  email: string;
  phone?: string;  // Optional new field
}

// Adding new endpoints
@Post('/api/users/export')  // New endpoint

// Adding new response fields
interface UserResponse {
  id: string;
  name: string;
  newField?: string;  // Optional new field
}
```

### Breaking Changes
```typescript
// Removing fields
interface User {
  name: string;
  // email removed (breaking!)
}

// Changing types
interface User {
  id: number;  // Was string before (breaking!)
  name: string;
}

// Required new fields
interface CreateUser {
  name: string;
  role: string;  // New required field (breaking!)
}
``` 