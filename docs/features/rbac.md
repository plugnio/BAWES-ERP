# Role-Based Access Control (RBAC)

## Overview
Our RBAC system uses automatic permission discovery from code decorators combined with database storage for roles and permissions. This provides a flexible, maintainable, and type-safe way to manage permissions across the application.

## Technical Design

### Architecture
- Automatic permission discovery using NestJS decorators
- Database-backed roles and permissions
- Category-based permission organization
- Runtime permission checking via Guards
- Automatic permission deprecation handling

### Database Schema
See [Database Schema](../database/schema.md#rbac-models) for the complete schema.

### Key Components
1. **Permission Discovery Service**
   - Scans controllers for `@RequirePermission` decorators
   - Syncs permissions with database
   - Handles permission deprecation

2. **Permission Guard**
   - Runtime permission checking
   - Handles SUPER_ADMIN role
   - Respects deprecated permissions

3. **Role Management**
   - System vs Custom roles
   - Role-Permission relationships
   - User-Role assignments

## Implementation Guide

### Adding New Permissions

1. Use the decorator in your controllers:
```typescript
@RequirePermission('category.action')
@Post()
methodName() {
  // Implementation
}
```

2. Follow naming convention:
   - Format: `category.action`
   - Examples:
     - `users.create`
     - `system.manage_roles`
     - `reports.generate`

### Permission Categories
Categories are automatically derived from permission codes and maintain a sort order for UI display:

```typescript
// Example categories with sort order
{
  name: 'System',
  sortOrder: 0,
  permissions: [...]
},
{
  name: 'Users',
  sortOrder: 10,
  permissions: [...]
},
{
  name: 'Reports',
  sortOrder: 20,
  permissions: [...]
}
```

### System Roles
System roles are protected and come with predefined permissions:

1. **SUPER_ADMIN**
   - Has all permissions
   - Cannot be modified/deleted
   - Automatically gets new permissions

2. **SYSTEM_ADMIN**
   - Limited system permissions
   - Cannot be deleted
   - Permissions can be configured

## Development Guidelines

### Best Practices
1. **Permission Management**
   - Keep permissions granular
   - Use clear, descriptive codes
   - Document new categories
   - Maintain sort order for UI display

2. **Role Management**
   - Base roles on job functions
   - Follow least privilege principle
   - Review role assignments regularly
   - Use system roles sparingly

3. **Permission Deprecation**
   - Remove unused permissions from code
   - System marks them as deprecated
   - Monitor deprecated permission usage
   - Clean up after safe period

### Development Workflow
1. Add `@RequirePermission()` decorators
2. Restart app to discover permissions
3. Check logs for permission sync
4. Assign permissions to roles
5. Test permission enforcement

### Testing
1. Use TEST_ROLE in development
2. Add test permissions to dev seed
3. Mock PermissionGuard in unit tests
4. Test with different role combinations

## API Reference

### Role Management
```typescript
// List roles
GET /roles

// Create role
POST /roles
{
  "name": "EDITOR",
  "description": "Content editor role",
  "permissions": ["content.create", "content.edit"]
}

// Update role
PUT /roles/:id
{
  "permissions": ["content.create", "content.edit", "content.publish"]
}
```

### Permission Management
```typescript
// List permissions by category
GET /permissions/categories

// Response format
{
  "System": [
    {
      "code": "system.manage_roles",
      "name": "Manage Roles",
      "sortOrder": 0
    }
  ],
  "Users": [
    {
      "code": "users.create",
      "name": "Create Users",
      "sortOrder": 10
    }
  ]
}
```

## Troubleshooting

### Common Issues
1. **Permissions not discovered**
   - Check decorator syntax
   - Verify controller is in NestJS module
   - Restart application

2. **Permission check fails**
   - Verify role assignments
   - Check for deprecated permissions
   - Confirm permission exists in database

3. **UI display order issues**
   - Verify category sort orders
   - Check permission sort orders
   - Update seed data if needed 