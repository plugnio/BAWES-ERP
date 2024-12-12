# Authorization in BAWES ERP

## Overview

BAWES ERP implements a comprehensive role-based access control (RBAC) system with fine-grained permissions.

## Role Hierarchy

```
SuperAdmin
  └── Admin
       ├── Manager
       │    └── User
       └── Accountant
            └── Viewer
```

## Permission Structure

### Role Definitions

```typescript
interface Role {
  name: string;
  permissions: Permission[];
  inheritsFrom?: Role;
}

interface Permission {
  resource: string;
  actions: Action[];
}

enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete'
}
```

### Default Roles

1. **SuperAdmin**
   - Full system access
   - User management
   - System configuration

2. **Admin**
   - User management
   - Report access
   - Configuration

3. **Manager**
   - Transaction approval
   - Report viewing
   - User supervision

4. **Accountant**
   - Financial operations
   - Report generation
   - Transaction processing

5. **User**
   - Basic operations
   - Personal dashboard
   - Transaction initiation

6. **Viewer**
   - Read-only access
   - Report viewing
   - Dashboard access

## Implementation

### Decorators

```typescript
@Roles('admin', 'manager')
@Controller('transactions')
export class TransactionController {
  @Roles('admin')
  @Post()
  create(@Body() data: CreateTransactionDto) {
    // Implementation
  }
}
```

### Guards

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Implementation
  }
}
```

## Best Practices

1. **Principle of Least Privilege**
   - Grant minimum necessary permissions
   - Regular permission audits
   - Time-bound access

2. **Role Assignment**
   - Document role changes
   - Approval workflow
   - Regular review

3. **Audit Trail**
   - Log permission changes
   - Track access attempts
   - Monitor usage patterns

## Security Considerations

### Access Control

- Validate at API level
- Check database access
- Verify file permissions

### Session Management

- Token validation
- Session timeout
- Concurrent sessions

### Error Handling

- Generic error messages
- Proper logging
- Audit failures

## Testing

### Unit Tests

```typescript
describe('RolesGuard', () => {
  it('should allow admin access', () => {
    const guard = new RolesGuard();
    const context = createMockContext('admin');
    expect(guard.canActivate(context)).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Authorization', () => {
  it('should restrict access', async () => {
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', 'Bearer user-token');
    
    expect(response.status).toBe(403);
  });
});
```

## Troubleshooting

### Common Issues

1. Token Expiration
2. Missing Permissions
3. Role Inheritance
4. Guard Configuration

### Solutions

- Check token validity
- Verify role assignment
- Review permissions
- Update configuration
``` 