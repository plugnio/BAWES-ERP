import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PermissionDiscoveryService } from '../../src/rbac/services/permission-discovery.service';

/**
 * Helper to discover actual permissions from code decorators
 * This ensures our tests use real permissions from our implementation
 */
export async function discoverActualPermissions() {
  // Create a test module with discovery services
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // Get the discovery service
  const discoveryService = moduleRef.get(PermissionDiscoveryService);
  
  // Access the private method to get actual permissions
  const permissions = await (discoveryService as any).discoverPermissions();
  
  await moduleRef.close();
  
  return permissions;
} 