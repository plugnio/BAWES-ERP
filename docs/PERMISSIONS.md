# Dynamic Permission System Documentation

## Overview

The permission system is designed to be fully dynamic and manageable through a single admin interface. It uses bitfields for efficient permission checking while maintaining the flexibility of a database-driven system.

## Key Features

- Dynamic permission creation and management
- Category-based permission organization
- Efficient bitfield-based permission checking
- Role-based access control
- System roles for critical functionality
- Single admin interface for all permission management

## Database Structure

### Permission Categories
- Groups permissions into logical categories
- Helps organize permissions in the UI
- Allows for better permission management

### Permissions
- Unique code for each permission
- Bitfield value for efficient checking
- Belongs to a category
- Can be assigned to multiple roles

### Roles
- Named collection of permissions
- Can be system roles (protected from modification)
- Assignable to users
- Hierarchical through permission inheritance

## API Endpoints

### Dashboard
```http
GET /admin/permissions/dashboard
```
Returns an overview of the permission system including:
- Categories with permissions
- Roles
- Statistics

### Categories
```http
POST /admin/permissions/categories
```
Create a new permission category:
```json
{
  "name": "User Management",
  "description": "User-related permissions",
  "sortOrder": 1
}
```

### Permissions
```http
POST /admin/permissions/permissions
```
Create a new permission:
```json
{
  "code": "users.create",
  "name": "Create Users",
  "description": "Can create new users",
  "categoryId": "category_id"
}
```

### Roles
```http
PUT /admin/permissions/roles/:id/permissions
```
Update role permissions:
```json
{
  "permissionIds": ["permission1_id", "permission2_id"]
}
```

## Usage Examples

### Checking Permissions in Guards
```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionManagementService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return this.permissionService.hasPermission(
      user.id, 
      'users.create'
    );
  }
}
```

### Using Permission Decorators
```typescript
@Controller('users')
export class UsersController {
  @Post()
  @RequirePermissions('users.create')
  async createUser(@Body() data: CreateUserDto) {
    // Implementation
  }
}
```

### Managing Roles
```typescript
// Create a new role with permissions
const role = await permissionService.createRole({
  name: 'Content Manager',
  description: 'Can manage content',
  permissions: ['content.create', 'content.edit', 'content.delete']
});

// Assign role to user
await permissionService.assignRoleToUser(userId, roleId);
```

## Best Practices

1. **Permission Naming**
   - Use dot notation: `resource.action`
   - Keep names consistent and clear
   - Examples: `users.create`, `content.edit`

2. **Categories**
   - Group related permissions
   - Keep categories broad but meaningful
   - Use clear, action-oriented names

3. **Roles**
   - Create roles based on job functions
   - Use system roles for critical permissions
   - Implement principle of least privilege

4. **Permission Checking**
   - Cache permission calculations where possible
   - Use bitfield operations for efficiency
   - Always check permissions at controller level

5. **Security**
   - Protect permission management endpoints
   - Log permission changes
   - Regular permission audits

## Initial Setup

1. Run migrations:
```bash
npx prisma migrate dev
```

2. Seed initial permissions:
```bash
npm run seed
```

3. Create super admin:
```bash
npm run create-admin
```

## Common Tasks

### Adding New Permissions
1. Create category if needed
2. Add permission with appropriate code
3. Assign to relevant roles

### Creating Custom Roles
1. Navigate to permission dashboard
2. Create new role
3. Select permissions
4. Assign to users

### Auditing Permissions
1. Use dashboard to view all permissions
2. Check role assignments
3. Review system roles

## Troubleshooting

### Common Issues
1. Permission denied unexpectedly
   - Check role assignments
   - Verify permission exists
   - Check permission code spelling

2. Performance issues
   - Enable permission caching
   - Review permission calculations
   - Check database indexes

### Support

For issues or questions:
1. Check documentation
2. Review logs
3. Contact system administrator 