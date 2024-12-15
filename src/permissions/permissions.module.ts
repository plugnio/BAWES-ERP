import { Module } from '@nestjs/common';
import { PermissionManagementService } from './permission-management.service';
import { PermissionManagementController } from './permission-management.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PermissionManagementService],
  controllers: [PermissionManagementController],
  exports: [PermissionManagementService]
})
export class PermissionsModule {} 