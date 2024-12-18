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
    const roles = await permissionService.getRoles(true);
    const categories = await permissionService.getPermissionCategories();
    const totalPermissions = categories.reduce(
      (acc, cat) => acc + cat.permissions.length,
      0
    );
    
    console.log('\n=== Permission Audit Report ===\n');

    // 1. System Overview
    console.log('System Overview:');
    console.log(`Total Permissions: ${totalPermissions}`);
    console.log(`Total Roles: ${roles.length}`);
    console.log(`System Roles: ${roles.filter(r => r.isSystem).length}`);

    // 2. Permission Distribution
    console.log('\nPermission Distribution by Category:');
    for (const category of categories) {
      console.log(`${category.name}: ${category.permissions.length} permissions`);
    }

    // 3. Role Analysis
    console.log('\nRole Permission Analysis:');
    for (const role of roles) {
      const permissionIds = role.permissions?.map(rp => rp.permissionId) || [];
      const rolePermissions = categories
        .flatMap(c => c.permissions)
        .filter(p => permissionIds.includes(p.id));

      const permCount = rolePermissions.length;
      const permPercent = ((permCount / totalPermissions) * 100).toFixed(1);
      console.log(`${role.name}${role.isSystem ? ' (System)' : ''}:`);
      console.log(`  - ${permCount} permissions (${permPercent}% of total)`);
      
      // Check for potentially dangerous combinations
      const dangerousPerms = rolePermissions
        .filter(p => p.code.includes('delete') || p.code.includes('admin'))
        .map(p => p.code);
      
      if (dangerousPerms.length > 0) {
        console.log('  - ⚠️ High-risk permissions:');
        dangerousPerms.forEach(p => console.log(`    * ${p}`));
      }
    }

    // 4. Permission Usage Patterns
    console.log('\nPermission Categories Coverage:');
    console.log(`Total Categories: ${categories.length}`);
    
    // 5. Unused Permissions
    const usedPermissionIds = new Set(
      roles.flatMap(role => role.permissions?.map(rp => rp.permissionId) || [])
    );

    const unusedPermissions = categories
      .flatMap(cat => cat.permissions)
      .filter(p => !usedPermissionIds.has(p.id));

    if (unusedPermissions.length > 0) {
      console.log('\n⚠️ Unused Permissions:');
      unusedPermissions.forEach(p => {
        console.log(`  - ${p.code} (${p.description || 'No description'})`);
      });
    }

    // 6. Security Recommendations
    console.log('\nSecurity Recommendations:');
    
    // Check for roles with too many permissions
    const highPermRoles = roles
      .filter(r => !r.isSystem && (r.permissions?.length || 0) > totalPermissions * 0.7)
      .map(r => r.name);
    
    if (highPermRoles.length > 0) {
      console.log('⚠️ Roles with unusually high permission counts:');
      highPermRoles.forEach(r => console.log(`  - ${r}`));
      console.log('  Consider splitting these roles into more specific ones');
    }

    // Check for empty categories
    const emptyCategories = categories
      .filter(c => c.permissions.length === 0)
      .map(c => c.name);
    
    if (emptyCategories.length > 0) {
      console.log('\n⚠️ Empty permission categories:');
      emptyCategories.forEach(c => console.log(`  - ${c}`));
      console.log('  Consider removing or populating these categories');
    }

  } catch (error) {
    console.error('Failed to audit permissions:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error); 