# Permission System Documentation

## Overview
The permission system implements a Discord-like Role-Based Access Control (RBAC) with bitfield-based permissions and hierarchical roles.

## Features

### 1. Role Management
- **Hierarchical Roles**: Roles are ordered by position (sortOrder)
- **Role Colors**: Support for hex color codes (like Discord)
- **Role Permissions**: Dynamic permission assignment
- **System Roles**: Protected roles that cannot be modified (isSystem flag)

### 2. Permission Implementation
- **Bitfield-Based**: Uses Decimal.js for efficient permission calculations with support for over 100k unique permissions
- **Category Organization**: Permissions are grouped into categories
- **Dynamic Generation**: New permissions auto-generate appropriate bitfields

### 3. Caching Strategy
The system uses `@nestjs/cache-manager` for performance optimization:

```typescript
CacheModule.register({
  ttl: 60 * 60 * 1000, // 1 hour cache duration
  max: 100 // Maximum cache entries
})
```

#### Cache Implementation Details
- **Storage**: In-memory cache using Node's memory
- **Key Format**: `user-permissions:{userId}`
- **Cache Size**: Limited to 100 entries to prevent memory overflow
- **Cache Duration**: 1 hour TTL (Time To Live)
- **Invalidation**: Cache is cleared when:
  - Role permissions are modified
  - User roles are changed
  - Role hierarchy is updated

#### Why 100 Max Limit?
1. **Memory Management**: Prevents unbounded memory growth
2. **Active Users**: Caches permissions for ~100 most active users
3. **LRU Strategy**: Least Recently Used entries are removed when limit is reached
4. **Performance Balance**: Balances memory usage vs computation cost

### 4. API Endpoints

#### Role Management
```typescript
GET    /admin/roles              // List all roles
POST   /admin/roles              // Create new role
PATCH  /admin/roles/:id/permissions  // Update role permissions
PATCH  /admin/roles/:id/position     // Update role hierarchy
```

#### User Role Management
```typescript
POST   /admin/roles/users/:userId/roles     // Assign role
DELETE /admin/roles/users/:userId/roles/:roleId  // Remove role
```

### 5. Permission Guards
```typescript
@RequirePermissions('roles.create')  // Decorator for permission checks
```

## Permission Categories
- **User Management**: `users.*`
- **Role Management**: `roles.*`
- **System Administration**: `system.*`

## Best Practices

### 1. Role Creation
```typescript
const role = await permissionService.createRole({
  name: "Moderator",
  color: "#FF0000",
  permissions: ["users.read", "users.write"]
});
```

### 2. Permission Checking
```typescript
// Using Decimal.js for precise permission checks
const hasPermission = userBits
  .dividedBy(permissionBitfield)
  .modulo(2)
  .equals(1);
```

### 3. Role Assignment
```typescript
await permissionService.assignRoleToUser(userId, roleId);
```

## Security Considerations

1. **System Roles**: Cannot be modified through API
2. **Permission Inheritance**: Higher roles inherit lower role permissions
3. **Cache Invalidation**: Immediate on permission changes
4. **Validation**: All inputs are validated using class-validator

## Performance Optimization

1. **Bitfield Operations**: O(1) permission checks using Decimal.js operations
2. **Caching**: Reduces database queries for permission checks
3. **Bulk Operations**: Uses transaction for role position updates
4. **Indexed Queries**: Database indexes on frequently queried fields

## Error Handling

1. **Not Found**: NotFoundException for invalid roles/permissions
2. **Forbidden**: ForbiddenException for system role modifications
3. **Validation**: Automatic DTO validation using class-validator
4. **Cache Errors**: Graceful fallback to database on cache failures

## CLI Tools

### Permission Management Scripts

The system includes several CLI tools for permission management:

#### 1. List Permissions
```bash
npm run permissions:list
```
Lists all permissions in the system with detailed information:
- System overview (total permissions, roles, system roles)
- Permissions organized by category
- Role assignments and their permissions

#### 2. Add Permissions
```bash
npm run permissions:add -- <code> <name> <category> [description]

# Example
npm run permissions:add -- "users.create" "Create User" "Users" "Allows creating new users"
```
Adds new permissions to the system:
- Creates category if it doesn't exist
- Assigns unique bitfield automatically
- Grants permission to SUPER_ADMIN role
- Validates permission format

#### 3. Audit Permissions
```bash
npm run permissions:audit
```
Generates comprehensive permission audit report:
- Permission distribution analysis
- Role permission coverage
- Unused permission detection
- Security recommendations
- High-risk permission combinations
- Empty category detection

### Best Practices for CLI Usage

1. **Regular Auditing**
   - Run permission audit regularly
   - Review unused permissions
   - Check for security issues
   - Monitor permission distribution

2. **Permission Management**
   - Use standard naming conventions
   - Document new permissions
   - Review before adding
   - Keep categories organized

3. **Security Considerations**
   - Audit high-risk permissions
   - Review role assignments
   - Check permission inheritance
   - Monitor system roles