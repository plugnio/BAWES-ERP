import { Module } from '@nestjs/common';
import { PermissionManagementService } from './permission-management.service';
import { RoleManagementController } from './role-management.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisCacheModule } from '../cache/redis-cache.module';

@Module({
  imports: [PrismaModule, RedisCacheModule],
  controllers: [RoleManagementController],
  providers: [PermissionManagementService],
  exports: [PermissionManagementService],
})
export class PermissionsModule {}
