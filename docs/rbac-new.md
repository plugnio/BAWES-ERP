# Role-Based Access Control (RBAC) Implementation

## Overview
The RBAC system uses a combination of JWT tokens and Redis caching to provide efficient permission checking without database queries during requests.

## Key Components

### 1. Permission Discovery
- Permissions are automatically discovered from `@RequirePermissions` decorators
- Each permission gets a unique power-of-2 bitfield (1, 2, 4, 8, etc.)
- Permissions are stored in both database and Redis cache
- Format: `category.action` (e.g., users.create, roles.update)

### 2. Redis Caching
- Redis stores two main hashes:
  - `permission:bitfields`: Maps permission codes to bitfields
  - `permission:categories`: Groups permissions by category
- Cache is populated on application startup
- Cache is invalidated and repopulated when permissions change

### 3. JWT Token
- Contains user's combined permission bits
- Contains super admin flag
- No need to query database for permission checks

## Permission Check Flow

1. **Request Arrives**
```typescript
// JWT contains permission bits
Authorization: Bearer eyJhbGci...
{
  "sub": "123",
  "permissionBits": "7",  // Binary: 111
  "isSuperAdmin": false
}
```

2. **Permission Guard Intercepts**
```typescript
@RequirePermissions(['users.read', 'users.update'])
async updateUser() { ... }
```

3. **Permission Check Process**
```typescript
// a. Get required permissions from decorator
const permissions = ['users.read', 'users.update'];

// b. Get permission bitfields from Redis (no DB query)
const bitfields = await redis.hmget(
  'permission:bitfields',
  permissions
); // Returns ['2', '4']

// c. Check user's permission bits against required bits
const userBits = new Decimal('7');     // Binary: 111
const readBits = new Decimal('2');     // Binary: 010
const updateBits = new Decimal('4');   // Binary: 100

// d. Perform bitwise checks using Decimal.js
const hasRead = userBits.mod(readBits.mul(2)).gte(readBits);
const hasUpdate = userBits.mod(updateBits.mul(2)).gte(updateBits);
```

## Cache Invalidation

1. **When Permissions Change**
```typescript
// Event emitted
this.eventEmitter.emit('permissions.changed');

// Cache service catches event
this.eventEmitter.on('permissions.changed', 
  () => this.invalidatePermissionCache()
);
```

2. **Cache Repopulation**
```typescript
// Clear Redis cache
await redis.del('permission:bitfields');
await redis.del('permission:categories');

// Rediscover permissions
const permissions = await this.discoverPermissions();

// Repopulate Redis
await redis.hmset('permission:bitfields',
  ...permissions.flatMap(p => [p.code, p.bitfield])
);
```

## Performance Characteristics

1. **Per-Request Cost**
- No database queries
- One Redis HMGET operation
- Bitwise calculations using Decimal.js
- O(n) where n is number of required permissions

2. **Memory Usage**
- Redis: O(p) where p is total number of permissions
- JWT: O(1) - single combined bitfield

3. **Cache Operations**
- Population: Once at startup
- Invalidation: Only when permissions change
- Lookup: O(1) per permission

## Debugging

1. **Enable Debug Mode**
```bash
DEBUG=true npm run start
```

2. **Debug Logs Include**
- Permission discovery process
- Cache operations
- Per-request permission checks
- Bitwise calculations

## Best Practices

1. **Permission Naming**
- Use lowercase
- Format: `category.action`
- Categories: plural nouns (users, roles)
- Actions: verbs (create, read, update, delete)

2. **Bitfield Management**
- Never reuse bitfields
- Always use power-of-2 values
- Handle with Decimal.js for precision
- Cache invalidation on any change

3. **Testing**
- Test permission combinations
- Test edge cases with high bit values
- Test cache invalidation
- Test super admin bypass

## Example Usage

```typescript
// Controller
@Controller('users')
export class UserController {
  @Get()
  @RequirePermissions('users.read')
  async getUsers() { ... }

  @Post()
  @RequirePermissions(['users.create', 'users.read'])
  async createUser() { ... }
}

// Service
@Injectable()
export class UserService {
  async updateUser() {
    // Permission already checked by guard
    // No need for additional checks
  }
}
``` 