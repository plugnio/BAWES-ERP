// Permission categories with their permissions
export const categories = [
  {
    name: 'User Management',
    description: 'User-related permissions',
    sortOrder: 1,
    permissions: [
      { code: 'users.create', name: 'Create Users', description: 'Can create new users' },
      { code: 'users.read', name: 'View Users', description: 'Can view user list and details' },
      { code: 'users.update', name: 'Update Users', description: 'Can update user details' },
      { code: 'users.delete', name: 'Delete Users', description: 'Can delete users' }
    ]
  },
  {
    name: 'Role Management',
    description: 'Role and permission management',
    sortOrder: 2,
    permissions: [
      { code: 'roles.create', name: 'Create Roles', description: 'Can create new roles' },
      { code: 'roles.read', name: 'View Roles', description: 'Can view role list and details' },
      { code: 'roles.update', name: 'Update Roles', description: 'Can update role details' },
      { code: 'roles.delete', name: 'Delete Roles', description: 'Can delete roles' }
    ]
  },
  {
    name: 'System Administration',
    description: 'System-level administrative permissions',
    sortOrder: 0,
    permissions: [
      { code: 'system.manage_permissions', name: 'Manage Permissions', description: 'Can manage system permissions' },
      { code: 'system.manage_roles', name: 'Manage Roles', description: 'Can manage system roles' },
      { code: 'system.manage_users', name: 'Manage Users', description: 'Can manage system users' },
      { code: 'system.view_audit_logs', name: 'View Audit Logs', description: 'Can view system audit logs' }
    ]
  }
];

// Predefined roles
export const roles = [
  {
    name: 'SUPER_ADMIN',
    description: 'Super Administrator with all permissions',
    isSystem: true,
    sortOrder: 0,
    // Will be assigned all permissions
    permissions: '*'
  },
  {
    name: 'ADMIN',
    description: 'Administrator with limited system access',
    isSystem: true,
    sortOrder: 1,
    permissions: [
      'users.create',
      'users.read',
      'users.update',
      'roles.read',
      'system.view_audit_logs'
    ]
  },
  {
    name: 'USER',
    description: 'Regular user with basic permissions',
    isSystem: true,
    sortOrder: 2,
    permissions: [
      'users.read'
    ]
  }
]; 