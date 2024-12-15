// Permission categories with their permissions
export const categories = [
  {
    name: 'User Management',
    description: 'User-related permissions',
    sortOrder: 1,
    permissions: [
      { code: 'User:Create', name: 'Create Users', description: 'Can create new users' },
      { code: 'User:Read', name: 'View Users', description: 'Can view user list and details' },
      { code: 'User:Update', name: 'Update Users', description: 'Can update user details' },
      { code: 'User:Delete', name: 'Delete Users', description: 'Can delete users' },
      { code: 'User:Invite', name: 'Invite Users', description: 'Can invite new users' }
    ]
  },
  {
    name: 'Role Management',
    description: 'Role and permission management',
    sortOrder: 2,
    permissions: [
      { code: 'Role:Create', name: 'Create Roles', description: 'Can create new roles' },
      { code: 'Role:Read', name: 'View Roles', description: 'Can view role list and details' },
      { code: 'Role:Update', name: 'Update Roles', description: 'Can update role details' },
      { code: 'Role:Delete', name: 'Delete Roles', description: 'Can delete roles' }
    ]
  },
  {
    name: 'System Administration',
    description: 'System-level administrative permissions',
    sortOrder: 0,
    permissions: [
      { code: 'Permission:Manage', name: 'Manage Permissions', description: 'Can manage system permissions' },
      { code: 'Role:Manage', name: 'Manage Roles', description: 'Can manage system roles' },
      { code: 'User:Manage', name: 'Manage Users', description: 'Can manage system users' },
      { code: 'Audit:Read', name: 'View Audit Logs', description: 'Can view system audit logs' }
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
      'User:Create',
      'User:Read',
      'User:Update',
      'User:Invite',
      'Role:Read',
      'Audit:Read'
    ]
  },
  {
    name: 'USER',
    description: 'Regular user with basic permissions',
    isSystem: true,
    sortOrder: 2,
    permissions: [
      'User:Read'
    ]
  }
]; 