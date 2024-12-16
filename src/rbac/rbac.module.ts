import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PermissionDiscoveryService } from './services/permission-discovery.service';
import { PermissionGuard } from './guards/permission.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    DiscoveryModule,
    PrismaModule,
    CacheModule.register({
      ttl: 300, // 5 minutes
    }),
  ],
  providers: [PermissionDiscoveryService, PermissionGuard],
  exports: [PermissionDiscoveryService, PermissionGuard],
})
export class RbacModule {}
