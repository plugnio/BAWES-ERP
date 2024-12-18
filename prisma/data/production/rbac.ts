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
      'roles.read',
      'roles.assign'
    ]
  }
]; 