import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { RoleService } from './services/role.service';
import { RoleController } from './controllers/role.controller';
import { PermissionService } from './services/permission.service';
import { PermissionDiscoveryService } from './services/permission-discovery.service';
import { PersonRoleService } from './services/person-role.service';
import { RbacCacheService } from './services/rbac-cache.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { PermissionController } from './controllers/permission.controller';
import { ConfigModule } from '@nestjs/config';
import { PermissionCacheService } from './services/permission-cache.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    PrismaModule, 
    RedisCacheModule, 
    DiscoveryModule,
    ConfigModule.forRoot({
      isGlobal: true
    }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [RoleController, PermissionController],
  providers: [
    RoleService,
    PermissionService,
    PermissionDiscoveryService,
    PersonRoleService,
    RbacCacheService,
    PermissionCacheService,
  ],
  exports: [
    RoleService,
    PermissionService,
    PermissionDiscoveryService,
    PersonRoleService,
    RbacCacheService,
    PermissionCacheService,
  ],
})
export class RbacModule {}
