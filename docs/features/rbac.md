# Role-Based Access Control (RBAC)

## Overview
Our RBAC system implements efficient permission management using bitfield-based permission checks and automatic permission discovery.

## Key Features
- 🔍 Automatic permission discovery from code decorators
- 🚀 Efficient bitfield-based permission checks (O(1))
- 🔒 System roles protection
- 📊 Category-based permission organization
- 🏷️ Permission deprecation support
- 🎯 Minimal developer overhead

## Technical Implementation

### 1. Permission Discovery
```typescript
// Add permission decorator to endpoint
@RequirePermission('users.create')
@Post()
createUser() {
  // Implementation
}

// Permission is automatically:
// 1. Discovered on app start
// 2. Assigned a unique bitfield (1 << index)
// 3. Added to database
// 4. Granted to SUPER_ADMIN role
```

### 2. Bitfield-Based Permissions
```typescript
// Each permission gets a unique power-of-2 bitfield using Decimal.js
import Decimal from 'decimal.js';

let nextBitfield = new Decimal(1);
nextBitfield = nextBitfield.mul(2); // 2, 4, 8, 16, etc.

// Efficient permission checks using Decimal.js operations
const hasPermission = userBits.and(permissionBitfield).eq(permissionBitfield);
```

### 3. JWT Implementation
```typescript
// Minimal JWT payload
interface JwtPayload {
  sub: string;          // Person ID
  email: string;        // Primary email
  permissionBits: string; // Combined permission bitfield
}
```

### 4. Permission Caching
```typescript
// Cache permission check results for 5 minutes
const cacheKey = `permissions:${personId}:${permission}`;
await cacheManager.set(cacheKey, hasPermission, 300);
```

## Database Schema

### Permission Model
```prisma
model Permission {
  id           String   @id @default(cuid())
  code         String   @unique
  name         String
  description  String?
  category     String
  isDeprecated Boolean  @default(false)
  sortOrder    Int      @default(0)
  bitfield     Decimal  @db.Decimal(40,0) // Support for over 100k permissions
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  roles        RolePermission[]

  @@index([category, sortOrder])
  @@index([isDeprecated])
}
```

### Role Model
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isSystem    Boolean  @default(false)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  permissions RolePermission[]
  users       PersonRole[]
}
```

## Developer Workflow

### 1. Adding New Permissions
Simply add the permission decorator to your endpoint:
```typescript
@RequirePermission('category.action')
@Post()
endpoint() {
  // Implementation
}
```

The system automatically:
- Discovers the permission
- Assigns a unique bitfield
- Adds it to the database
- Grants it to SUPER_ADMIN

### 2. Managing Roles
```typescript
// Create role
const role = await prisma.role.create({
  data: {
    name: "Editor",
    description: "Content editor role",
    isSystem: false
  }
});

// Assign permissions to role
await prisma.rolePermission.createMany({
  data: permissionIds.map(id => ({
    roleId: role.id,
    permissionId: id
  }))
});
```

### 3. Assigning Roles
```typescript
// Assign role to user
await prisma.personRole.create({
  data: {
    personId: userId,
    roleId: roleId
  }
});
```

## Performance Optimization

### 1. Bitfield Operations
- O(1) permission checks using Decimal.js operations
- Support for over 100,000 permissions via Decimal(40,0)
- Efficient permission combination using decimal arithmetic
- Minimal memory usage in JWT payload (string representation)

### 2. Caching Strategy
- Permission check results cached for 5 minutes
- Cache invalidation on role/permission changes
- Distributed cache support via cache-manager

### 3. Database Optimization
- Decimal(40,0) type for extended permission capacity
- Indexed permission lookups (category, sortOrder, isDeprecated)
- Efficient role-permission joins
- Minimal permission data in JWT

## Security Considerations

### 1. Permission Management
- Automatic bitfield assignment prevents collisions
- Deprecated permissions marked but not deleted
- System roles protected from modification

### 2. JWT Security
- Minimal payload exposure
- Efficient permission representation
- Secure token handling

### 3. Role Security
- System roles protected
- Role assignment audit logging
- Permission deprecation support

## Error Handling

### 1. Permission Discovery
```typescript
try {
  await syncPermissions();
} catch (error) {
  logger.error('Permission sync failed', error);
  // App continues running
}
```

### 2. Permission Checks
```typescript
try {
  const hasPermission = await checkPermission(user, 'action');
} catch (error) {
  throw new UnauthorizedException();
}
```

## Best Practices

1. **Permission Naming**
   - Use format: `category.action`
   - Keep categories consistent
   - Use descriptive action names

2. **Role Management**
   - Create roles based on job functions
   - Use system roles sparingly
   - Review role assignments regularly

3. **Permission Organization**
   - Group related permissions
   - Maintain consistent categories
   - Document permission purposes

4. **Performance**
   - Use bitfield operations
   - Implement proper caching
   - Monitor permission count

## Testing

1. **Unit Tests**
   - Permission discovery
   - Bitfield operations
   - Cache functionality

2. **Integration Tests**
   - Role assignment
   - Permission checks
   - JWT handling

3. **E2E Tests**
   - Complete auth flow
   - Role management
   - Permission enforcement