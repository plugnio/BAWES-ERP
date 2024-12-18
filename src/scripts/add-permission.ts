import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PermissionManagementService } from '../rbac/services/permission-management.service';

// Get command line arguments
const [,, code, name, category, description] = process.argv;

if (!code || !name || !category) {
  console.error(`
Usage: npm run permissions:add -- <code> <name> <category> [description]

Arguments:
code        - Permission code (e.g., "users.create")
name        - Display name (e.g., "Create User")
category    - Category name (e.g., "Users")
description - Optional description

Example: npm run permissions:add -- "users.create" "Create User" "Users" "Allows creating new users"
`);
  process.exit(1);
}

async function bootstrap() {
  // Create a standalone application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    // Disable authentication and other middleware
    logger: false,
  });

  const permissionService = app.get(PermissionManagementService);

  try {
    // Create the permission
    const permission = await permissionService.createPermission({
      code,
      name,
      category,
      description
    });

    console.log('\nPermission created successfully:');
    console.log(JSON.stringify(permission, null, 2));

    // Get SUPER_ADMIN role
    const roles = await permissionService.getRoles();
    const superAdmin = roles.find(r => r.name === 'SUPER_ADMIN');
    
    if (superAdmin) {
      // Grant to SUPER_ADMIN role
      await permissionService.toggleRolePermission(superAdmin.id, code, true);
      console.log('\nPermission automatically granted to SUPER_ADMIN role');
    }

  } catch (error) {
    console.error('Failed to add permission:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error); 