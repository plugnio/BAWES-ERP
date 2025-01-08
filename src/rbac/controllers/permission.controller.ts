import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions('permissions.manage')
export class PermissionController {
  constructor(
    private permissionService: PermissionService,
    private roleService: RoleService,
  ) {}

  @Get()
  async getPermissions() {
    const categories = await this.permissionService.getPermissionCategories();
    return categories.flatMap(cat => cat.permissions.map(p => ({
      ...p,
      category: p.category.toLowerCase(),
      code: p.code.toLowerCase()
    })));
  }

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