// Permission categories with their permissions
export const categories = [
  {
    name: 'System',
    description: 'System-level administrative permissions',
    sortOrder: 0,
    permissions: [
      { code: 'system.manage', name: 'Manage Permissions', description: 'Can manage system permissions', sortOrder: 0 },
      { code: 'roles.manage', name: 'Manage Roles', description: 'Can manage system roles', sortOrder: 1 },
      { code: 'users.manage', name: 'Manage Users', description: 'Can manage system users', sortOrder: 2 },
      { code: 'audit.read', name: 'View Audit Logs', description: 'Can view system audit logs', sortOrder: 3 }
    ]
  },
  {
    name: 'Users',
    description: 'User management permissions',
    sortOrder: 10,
    permissions: [
      { code: 'users.create', name: 'Create Users', description: 'Can create new users', sortOrder: 0 },
      { code: 'users.read', name: 'View Users', description: 'Can view user details', sortOrder: 1 },
      { code: 'users.update', name: 'Update Users', description: 'Can update user details', sortOrder: 2 },
      { code: 'users.delete', name: 'Delete Users', description: 'Can delete users', sortOrder: 3 }
    ]
  }
];

// Predefined system roles - these cannot be deleted through the UI
export const roles = [
  {
    name: 'SUPER_ADMIN',
    description: 'Super Administrator with all permissions',
    isSystem: true,
    sortOrder: 0,
    permissions: '*' // Will be assigned all permissions
  },
  {
    name: 'SYSTEM_ADMIN',
    description: 'System Administrator with limited system permissions',
    isSystem: true,
    sortOrder: 10,
    permissions: [
      'system.manage_users',
      'system.view_audit_logs',
      'users.create',
      'users.read',
      'users.update'
    ]
  }
]; 