# Permission Management API Documentation

## Overview
The Permission Management API provides endpoints for managing role-based access control (RBAC) in the system. It uses a bitfield-based permission system for efficient permission checks and supports hierarchical roles.

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Get Permission Categories
Returns all permissions grouped by category.

```http
GET /api/permissions/categories
```

**Response**
```json
{
  "categories": [
    {
      "name": "Users",
      "permissions": [
        {
          "id": "1",
          "code": "users.create",
          "name": "Create",
          "description": "Permission to create users",
          "category": "Users",
          "bitfield": "1"
        }
      ]
    }
  ]
}
```

### Get Permission Dashboard
Returns a dashboard view of permissions and roles.

```http
GET /api/permissions/dashboard
```

**Response**
```json
{
  "categories": [...],
  "roles": [...],
  "stats": {
    "totalPermissions": 10,
    "totalRoles": 5,
    "systemRoles": 2
  }
}
```

### Create Permission
Creates a new permission.

```http
POST /api/permissions
```

**Request Body**
```json
{
  "code": "users.delete",
  "name": "Delete",
  "category": "Users",
  "description": "Permission to delete users"
}
```

**Response**
```json
{
  "id": "2",
  "code": "users.delete",
  "name": "Delete",
  "category": "Users",
  "description": "Permission to delete users",
  "bitfield": "2",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Assign Role Permission
Assigns a permission to a role.

```http
POST /api/roles/{roleId}/permissions
```

**Request Body**
```json
{
  "permissionId": "1"
}
```

**Response**
```json
{
  "roleId": "1",
  "permissionId": "1",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Remove Role Permission
Removes a permission from a role.

```http
DELETE /api/roles/{roleId}/permissions/{permissionId}
```

### Get User Permissions
Returns permissions for a specific user.

```http
GET /api/users/{userId}/permissions
```

**Response**
```json
{
  "permissions": [
    {
      "code": "users.read",
      "name": "Read",
      "category": "Users"
    }
  ],
  "roles": [
    {
      "id": "1",
      "name": "Admin"
    }
  ],
  "effectivePermissions": "3" // Bitfield of combined permissions
}
```

## Error Responses

All endpoints may return the following errors:

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Not Found",
  "error": "Resource not found"
}
```

### 422 Unprocessable Entity
```json
{
  "statusCode": 422,
  "message": "Validation Failed",
  "errors": [
    {
      "field": "code",
      "message": "Permission code must be in format: category.action"
    }
  ]
}
```

## Permission Format

### Permission Code
Permission codes follow the format: `category.action`
- Category: lowercase noun (users, roles, permissions)
- Action: lowercase verb (create, read, update, delete)
Example: `users.create`

### Bitfield System
- Each permission gets a unique power-of-2 bitfield (1, 2, 4, 8, etc.)
- Combined permissions use bitwise operations
- Supports over 100k unique permissions
- Efficient permission checking

## Best Practices

1. **Permission Naming**
   - Use clear, descriptive names
   - Follow the category.action format
   - Keep categories consistent

2. **Role Management**
   - Create roles based on job functions
   - Follow principle of least privilege
   - Regularly audit role permissions

3. **Security**
   - Always validate permission requirements
   - Log permission changes
   - Review permission assignments regularly 