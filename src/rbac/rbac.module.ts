import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PermissionDiscoveryService } from './services/permission-discovery.service';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { PersonRoleService } from './services/person-role.service';
import { RbacCacheService } from './services/rbac-cache.service';
import { PermissionGuard } from './guards/permission.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { PermissionController } from './controllers/permission.controller';
import { RoleController } from './controllers/role.controller';

@Module({
  imports: [
    DiscoveryModule,
    PrismaModule,
    RedisCacheModule,
  ],
  controllers: [PermissionController, RoleController],
  providers: [
    PermissionDiscoveryService,
    PermissionService,
    RoleService,
    PersonRoleService,
    RbacCacheService,
    PermissionGuard,
  ],
  exports: [
    PermissionDiscoveryService,
    PermissionService,
    RoleService,
    PersonRoleService,
    RbacCacheService,
    PermissionGuard,
  ],
})
export class RbacModule {}
