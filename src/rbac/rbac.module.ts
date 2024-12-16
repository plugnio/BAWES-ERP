import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PermissionDiscoveryService } from './services/permission-discovery.service';
import { PermissionManagementService } from './services/permission-management.service';
import { PermissionGuard } from './guards/permission.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { PermissionManagementController } from './controllers/permission-management.controller';
import { RoleManagementController } from './controllers/role-management.controller';

@Module({
  imports: [
    DiscoveryModule,
    PrismaModule,
    CacheModule.register({
      ttl: 300, // 5 minutes
    }),
  ],
  controllers: [PermissionManagementController, RoleManagementController],
  providers: [PermissionDiscoveryService, PermissionManagementService, PermissionGuard],
  exports: [PermissionDiscoveryService, PermissionManagementService, PermissionGuard],
})
export class RbacModule {}
