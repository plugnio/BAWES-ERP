import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { RoleService } from './services/role.service';
import { RoleController } from './controllers/role.controller';
import { PermissionService } from './services/permission.service';
import { PermissionDiscoveryService } from './services/permission-discovery.service';
import { PersonRoleService } from './services/person-role.service';
import { RbacCacheService } from './services/rbac-cache.service';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { PermissionController } from './controllers/permission.controller';

@Module({
  imports: [PrismaModule, RedisCacheModule, DiscoveryModule],
  controllers: [RoleController, PermissionController],
  providers: [
    RoleService,
    PermissionService,
    PermissionDiscoveryService,
    PersonRoleService,
    RbacCacheService,
    PermissionGuard,
  ],
  exports: [
    RoleService,
    PermissionService,
    PermissionDiscoveryService,
    PersonRoleService,
    RbacCacheService,
    PermissionGuard,
  ],
})
export class RbacModule {}
