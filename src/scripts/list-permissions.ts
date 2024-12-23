import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PermissionService } from '../rbac/services/permission.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const permissionService = app.get(PermissionService);

  try {
    const categories = await permissionService.getPermissionCategories();

    console.log('\n=== Permission List ===\n');

    for (const category of categories) {
      console.log(`\n${category.name}:`);
      for (const permission of category.permissions) {
        console.log(`  - ${permission.code}: ${permission.description || 'No description'}`);
      }
    }
  } catch (error) {
    console.error('Failed to list permissions:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
