// Permission categories with their permissions
export const categories = [
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

// Predefined roles - only SUPER_ADMIN for production
export const roles = [
  {
    name: 'SUPER_ADMIN',
    description: 'Super Administrator with all permissions',
    isSystem: true,
    sortOrder: 0,
    // Will be assigned all permissions
    permissions: '*'
  }
]; 