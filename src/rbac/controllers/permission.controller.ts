import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('permissions.manage')
export class PermissionController {
  constructor(
    private permissionService: PermissionService,
    private roleService: RoleService,
  ) {}

  @Get('dashboard')
  async getPermissionDashboard() {
    const [categories, roles] = await Promise.all([
      this.permissionService.getPermissionCategories(),
      this.roleService.getRoles(true),
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
} 