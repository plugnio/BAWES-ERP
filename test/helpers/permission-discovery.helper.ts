import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PermissionDiscoveryService } from '../../src/rbac/services/permission-discovery.service';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Helper to discover actual permissions from code decorators
 * This ensures our tests use real permissions from our implementation
 */
export async function discoverActualPermissions() {
  // Create a test module with discovery services
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // Get the discovery service and prisma
  const discoveryService = moduleRef.get(PermissionDiscoveryService);
  const prisma = moduleRef.get(PrismaService);
  
  // Run the discovery process
  await discoveryService.onModuleInit();
  
  // Get the permissions from the database
  const permissions = await prisma.permission.findMany({
    where: { isDeprecated: false },
    orderBy: { code: 'asc' },
  });
  
  await moduleRef.close();
  
  return permissions;
} 