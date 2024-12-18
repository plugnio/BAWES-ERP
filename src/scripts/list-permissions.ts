import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PermissionManagementService } from '../rbac/services/permission-management.service';

async function bootstrap() {
  // Create a standalone application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    // Disable authentication and other middleware
    logger: false,
  });

  const permissionService = app.get(PermissionManagementService);

  try {
    // Get all roles with their permissions
    const roles = await permissionService.getRoles(true);
    const categories = await permissionService.getPermissionCategories();

    console.log('\n=== Permission System Overview ===');
    console.log(`Total Roles: ${roles.length}`);
    console.log(`System Roles: ${roles.filter((r) => r.isSystem).length}`);
    console.log(`Total Categories: ${categories.length}`);

    console.log('\n=== Permissions by Category ===');
    for (const category of categories) {
      console.log(`\n${category.name}:`);
      for (const permission of category.permissions) {
        console.log(
          `  - ${permission.code}: ${permission.description || 'No description'}`,
        );
      }
    }

    console.log('\n=== Roles and Their Permissions ===');
    for (const role of roles) {
      console.log(`\n${role.name}${role.isSystem ? ' (System)' : ''}:`);
      if (role.permissions) {
        const permissionIds = role.permissions.map((rp) => rp.permissionId);
        // Get permission details for each permissionId
        const permissions = categories
          .flatMap((c) => c.permissions)
          .filter((p) => permissionIds.includes(p.id))
          .map((p) => p.code);

        permissions.sort();
        for (const permissionCode of permissions) {
          console.log(`  - ${permissionCode}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to list permissions:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
