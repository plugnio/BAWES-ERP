import { categories as prodCategories, roles as prodRoles } from '../production/rbac';

// Extend production categories with development-specific ones
export const categories = [
  ...prodCategories,
  {
    name: 'Test',
    description: 'Test permissions for development',
    sortOrder: 1000,
    permissions: [
      { code: 'test.permission1', name: 'Test Permission 1', description: 'Test permission 1', sortOrder: 0 },
      { code: 'test.permission2', name: 'Test Permission 2', description: 'Test permission 2', sortOrder: 1 }
    ]
  }
];

// Extend production roles with development-specific ones
export const roles = [
  ...prodRoles,
  {
    name: 'TEST_ROLE',
    description: 'Test role for development',
    isSystem: false,
    sortOrder: 1000,
    permissions: ['test.permission1', 'test.permission2']
  }
]; 