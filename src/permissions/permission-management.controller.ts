import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PermissionManagementService } from './permission-management.service';

@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions('Permission:Manage')
export class PermissionManagementController {
  constructor(private permissionService: PermissionManagementService) {}

  @Get('dashboard')
  async getPermissionDashboard() {
    const [categories, roles] = await Promise.all([
      this.permissionService.getPermissionCategories(),
      this.permissionService.getRoles(true),
    ]);

    return {
      categories,
      roles,
      stats: {
        totalPermissions: categories.reduce(
          (acc, cat) => acc + cat.permissions.length,
          0,
        ),
        totalRoles: roles.length,
        systemRoles: roles.filter((r) => r.isSystem).length,
      },
    };
  }

  @Post('categories')
  async createCategory(
    @Body() data: { name: string; description?: string; sortOrder?: number },
  ) {
    return this.permissionService.createPermissionCategory(data);
  }

  @Post('permissions')
  async createPermission(
    @Body()
    data: {
      code: string;
      name: string;
      description?: string;
      categoryId: string;
    },
  ) {
    return this.permissionService.createPermission(data);
  }

  @Put('roles/:id/permissions')
  async updateRolePermissions(
    @Param('id') roleId: string,
    @Body() data: { permissionIds: string[] },
  ) {
    return this.permissionService.updateRolePermissions(
      roleId,
      data.permissionIds,
    );
  }

  @Get('roles/:id')
  async getRole(@Param('id') roleId: string) {
    return this.permissionService.getRoleWithPermissions(roleId);
  }
}
