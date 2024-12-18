import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { PermissionManagementService } from '../services/permission-management.service';

@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('permissions.manage')
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
      category: string;
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
