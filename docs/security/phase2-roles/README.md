# Phase 2: Roles and Permissions

## Overview
This phase implements role-based access control (RBAC) and granular permissions management.

## Features

### 1. Role Hierarchy
```typescript
interface Role {
  name: string;
  level: number;
  inherits: string[];
  permissions: string[];
}

const roles = {
  super_admin: {
    level: 100,
    inherits: ['admin'],
  },
  admin: {
    level: 80,
    inherits: ['staff'],
  },
  staff: {
    level: 60,
    inherits: ['user'],
  },
  user: {
    level: 40,
    inherits: [],
  },
  guest: {
    level: 20,
    inherits: [],
  }
};
```

### 2. Granular Permissions
```typescript
interface Permission {
  code: string;        // e.g., "invoices:create"
  description: string;
  group: string;       // e.g., "invoices"
  action: string;      // e.g., "create"
}

// Example Permission Registry
const permissionsRegistry = {
  "invoices.create": {
    "description": "Create new invoices",
    "impact_level": "high",
    "requires": ["invoices.read"],
    "last_used": "2024-01-20T10:00:00Z",
    "usage_count": 1502
  },
  "invoices.approve": {
    "description": "Approve invoices for payment",
    "impact_level": "critical",
    "requires": ["invoices.read"],
    "amount_limits": true,
    "last_used": "2024-01-20T09:45:00Z",
    "usage_count": 305
  }
};
```

### 3. Permission Guards and Validation
```typescript
interface AppContext {
  app_id: string;
  required_permissions?: string[];
  minimum_level?: number;
}

const permissionGuard = (appContext: AppContext) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) throw new Error('No token provided');
      
      const decoded = verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
      
      // Check if user has access to this app
      const appAccess = decoded.apps[appContext.app_id];
      if (!appAccess) throw new Error('No access to this application');
      
      // Check minimum level if specified
      if (appContext.minimum_level && appAccess.level < appContext.minimum_level) {
        throw new Error('Insufficient access level');
      }
      
      // Check required permissions
      if (appContext.required_permissions) {
        const hasPermissions = appContext.required_permissions.every(perm => 
          appAccess.permissions.includes(perm) || 
          appAccess.permissions.includes(`${perm.split(':')[0]}:*`)
        );
        if (!hasPermissions) throw new Error('Insufficient permissions');
      }
      
      req.user = {
        ...decoded,
        currentApp: appAccess
      };
      next();
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
};
```

### 4. Role Templates
```typescript
interface RoleTemplate {
  name: string;
  description: string;
  apps: {
    [app_id: string]: {
      permissions: string[];
      filters: {
        [key: string]: any;
      };
    };
  };
}

const roleTemplates = {
  "finance_staff": {
    "name": "Finance Staff",
    "description": "Basic finance operations",
    "apps": {
      "erp_app": {
        "permissions": ["invoices.read", "invoices.create"],
        "filters": {
          "max_invoice_amount": 5000,
          "departments": ["finance"]
        }
      }
    }
  }
};
```

## Implementation Plan

### Stage 1: Core RBAC
- [ ] Role management system
- [ ] Basic role assignment
- [ ] Role hierarchy implementation
- [ ] Role-based guards

### Stage 2: Permissions
- [ ] Permission registry
- [ ] Permission assignment to roles
- [ ] Permission-based guards
- [ ] Permission inheritance

### Stage 3: Policies
- [ ] Custom policy engine
- [ ] Policy composition
- [ ] Dynamic policy evaluation
- [ ] Policy caching

## Best Practices

### 1. Role Assignment
- Assign roles per application
- Use inheritance to simplify role management
- Allow custom permission overrides
- Regular role reviews

### 2. Permission Management
- Follow least privilege principle
- Use permission groups
- Regular access reviews
- Document exceptions

### 3. Security
- Implement rate limiting per role
- Log all permission changes
- Regular audit of role assignments
- Review access patterns

## Testing Requirements
- Role assignment and removal
- Permission inheritance
- Guard effectiveness
- Policy evaluation
- Performance testing
- Permission conflict detection