# Roles and Permissions Management SDK Guide

## Overview

The BAWES-ERP SDK provides comprehensive endpoints for managing roles and permissions. This guide explains how to use these endpoints effectively in your frontend application.

## Authentication

All endpoints require authentication via Bearer token. The SDK automatically handles this when properly configured:

```typescript
// The SDK will automatically:
// 1. Add Authorization: Bearer <token> header
// 2. Handle token refresh
// 3. Manage permission bitfields
```

## Role Management Endpoints

### 1. Get All Roles
```typescript
// Get all roles with their permissions
const roles = await sdk.roles.getRoles();

// Response type:
interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  sortOrder: number;
  permissions: Permission[];
}
```

### 2. Get Single Role
```typescript
// Get a specific role by ID
const role = await sdk.roles.getRole(roleId);
```

### 3. Create Role
```typescript
// Create a new role
const role = await sdk.roles.createRole({
  name: "Editor",
  description: "Content editor role",
  sortOrder: 1 // Optional, for ordering
});
```

### 4. Delete Role
```typescript
// Delete a role (non-system roles only)
await sdk.roles.deleteRole(roleId);
```

### 5. Toggle Role Permissions
```typescript
// Enable/disable a permission for a role
await sdk.roles.togglePermissions(roleId, {
  permissionCode: "users.create",
  enabled: true
});
```

### 6. Update Role Position
```typescript
// Update role position (for drag-and-drop UI)
await sdk.roles.updatePosition(roleId, {
  position: 2
});
```

### 7. Assign Role to User
```typescript
// Assign a role to a user
await sdk.roles.assignRole(personId, roleId);
```

### 8. Remove Role from User
```typescript
// Remove a role from a user
await sdk.roles.removeRole(personId, roleId);
```

## Permission Management Endpoints

### 1. Get Permission Dashboard
```typescript
// Get all permissions organized by category
const dashboard = await sdk.permissions.getPermissionDashboard();

// Response type:
interface PermissionDashboard {
  categories: {
    name: string;
    description?: string;
    sortOrder: number;
    permissions: Permission[];
  }[];
  roles: Role[];
  stats: {
    totalPermissions: number;
    totalRoles: number;
    systemRoles: number;
  };
}
```

### 2. Create Permission Category
```typescript
// Create a new permission category
await sdk.permissions.createCategory({
  name: "Reports",
  description: "Report management permissions",
  sortOrder: 5
});
```

### 3. Update Category Position
```typescript
// Update category position
await sdk.permissions.updateCategoryPosition(categoryId, {
  position: 3
});
```

### 4. Create Permission
```typescript
// Create a new permission
await sdk.permissions.createPermission({
  code: "reports.generate",
  name: "Generate Reports",
  description: "Can generate system reports",
  category: "Reports"
});
```

### 5. Update Role Permissions (Bulk)
```typescript
// Update multiple permissions for a role at once
await sdk.permissions.updateRolePermissions(roleId, {
  permissionIds: ["perm1", "perm2", "perm3"]
});
```

### 6. Clear Permission Cache
```typescript
// Clear the permission cache (requires permissions.manage)
await sdk.permissions.clearCache();
```

## Drag and Drop Implementation

### Role Sorting

The system supports drag-and-drop sorting for roles with automatic position management:

```typescript
// 1. Get current roles with positions
const roles = await sdk.roles.getRoles();

// 2. Implement drag and drop UI
interface DragEvent {
  oldIndex: number;
  newIndex: number;
  roleId: string;
}

// 3. On drop, update position
async function onRoleDrop(event: DragEvent) {
  const { roleId, newIndex } = event;
  
  try {
    await sdk.roles.updatePosition(roleId, {
      position: newIndex
    });
    
    // Optionally refresh the list
    await refreshRolesList();
  } catch (error) {
    // Handle error
  }
}

// Example using a drag-and-drop library
<DragDropContext onDragEnd={onRoleDrop}>
  <Droppable droppableId="roles-list">
    {(provided) => (
      <div {...provided.droppableProps} ref={provided.innerRef}>
        {roles.map((role, index) => (
          <Draggable
            key={role.id}
            draggableId={role.id}
            index={index}
            isDragDisabled={role.isSystem} // Prevent system role reordering
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                {role.name}
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

### Permission Category Sorting

Similar to roles, permission categories can be reordered:

```typescript
// 1. Get categories from dashboard
const dashboard = await sdk.permissions.getPermissionDashboard();

// 2. Implement drag and drop
async function onCategoryDrop(event: DragEvent) {
  const { categoryId, newIndex } = event;
  
  try {
    await sdk.permissions.updateCategoryPosition(categoryId, {
      position: newIndex
    });
    
    // Optionally refresh
    await refreshDashboard();
  } catch (error) {
    // Handle error
  }
}
```

### Best Practices for Sorting

1. **Optimistic Updates**:
   ```typescript
   function handleDrop(result) {
     // 1. Update UI immediately
     const newItems = reorder(items, result.source.index, result.destination.index);
     setItems(newItems);
     
     // 2. Make API call
     try {
       await sdk.roles.updatePosition(result.draggableId, {
         position: result.destination.index
       });
     } catch (error) {
       // 3. Revert on failure
       setItems(items);
       showError(error);
     }
   }
   ```

2. **Batch Updates**:
   ```typescript
   // When reordering multiple items
   async function handleMultipleDrop(changes) {
     try {
       await Promise.all(
         changes.map(({ id, newPosition }) =>
           sdk.roles.updatePosition(id, { position: newPosition })
         )
       );
     } catch (error) {
       // Handle error and revert
     }
   }
   ```

3. **Position Calculation**:
   ```typescript
   function calculateNewPosition(items, sourceIndex, destinationIndex) {
     if (destinationIndex === 0) {
       // Moving to start
       return items[0].sortOrder / 2;
     }
     
     if (destinationIndex === items.length - 1) {
       // Moving to end
       return items[items.length - 1].sortOrder + 1000;
     }
     
     // Moving between items
     const prevPosition = items[destinationIndex - 1].sortOrder;
     const nextPosition = items[destinationIndex].sortOrder;
     return (prevPosition + nextPosition) / 2;
   }
   ```

## Permission Format

Permissions follow a consistent format: `category.action`

Common categories:
- `system.*` - System-level operations
- `users.*` - User management
- `roles.*` - Role management
- `permissions.*` - Permission management
- `audit.*` - Audit log operations

Common actions:
- `create` - Create new resources
- `read` - View/list resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `manage` - Full control over resources
- `assign` - Assign resources to others
- `approve` - Approve/reject operations

## Important Notes

1. **System Roles**:
   - Super Admin role automatically gets all permissions
   - System roles cannot be modified through the API
   - Changes to roles clear the permission cache

2. **Permission Discovery**:
   - New permissions are automatically discovered from backend code
   - Each permission gets a unique power-of-2 bitfield
   - Permission checks are performed using efficient bitwise operations
   - Permission cache is cleared when roles change

3. **Best Practices**:
   - Cache permission checks on frontend for 5 minutes
   - Clear permission cache when user roles change
   - Use the dashboard endpoint to build role management UI
   - Implement drag-and-drop for role ordering using updatePosition

## Error Handling

The SDK throws standardized errors that you should handle:

```typescript
try {
  await sdk.roles.createRole({ name: "Editor" });
} catch (error) {
  if (error.status === 403) {
    // Permission denied
  } else if (error.status === 400) {
    // Validation error
  }
}
```

## Debugging

Enable debug mode in the SDK to log detailed information:

```typescript
sdk.setDebug(true); // Enables detailed logging
```

This will log:
- API requests and responses
- Permission calculations
- Cache operations
- Token refresh events
- Drag and drop operations 