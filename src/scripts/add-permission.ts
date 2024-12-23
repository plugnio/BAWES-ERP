import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PermissionService } from '../rbac/services/permission.service';
import { RoleService } from '../rbac/services/role.service';

// Get command line arguments
const [, , code, name, category, description] = process.argv;

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
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const permissionService = app.get(PermissionService);
  const roleService = app.get(RoleService);

  try {
    // Create the permission
    const permission = await permissionService.createPermission({
      code,
      name,
      category,
      description,
    });

    console.log('\nPermission created successfully:');
    console.log(JSON.stringify(permission, null, 2));

    // Get SUPER_ADMIN role
    const roles = await roleService.getRoles();
    const superAdmin = roles.find((r) => r.name === 'SUPER_ADMIN');

    if (superAdmin) {
      // Grant to SUPER_ADMIN role
      await roleService.toggleRolePermission(superAdmin.id, code, true);
      console.log('\nPermission automatically granted to SUPER_ADMIN role');
    }
  } catch (error) {
    console.error('Failed to add permission:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
