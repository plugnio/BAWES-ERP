import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { PermissionManagementService } from '../services/permission-management.service';
import { CreateRoleDto } from '../dto/create-role.dto';

@ApiTags('Role Management')
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoleManagementController {
  constructor(private permissionService: PermissionManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles with their permissions' })
  @RequirePermission('roles.read')
  async getRoles() {
    return this.permissionService.getRoles(true);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @RequirePermission('roles.create')
  async createRole(@Body() data: CreateRoleDto) {
    return this.permissionService.createRole(data);
  }

  @Patch(':roleId/permissions')
  @ApiOperation({ summary: 'Toggle permissions for a role' })
  @RequirePermission('roles.update')
  async togglePermissions(
    @Param('roleId') roleId: string,
    @Body()
    data: {
      permissionCode: string;
      enabled: boolean;
    },
  ) {
    return this.permissionService.toggleRolePermission(
      roleId,
      data.permissionCode,
      data.enabled,
    );
  }

  @Patch(':roleId/position')
  @ApiOperation({ summary: 'Update role position (for drag-and-drop)' })
  @RequirePermission('roles.update')
  async updatePosition(
    @Param('roleId') roleId: string,
    @Body() data: { position: number },
  ) {
    return this.permissionService.updateRolePosition(roleId, data.position);
  }

  @Post('users/:userId/roles')
  @ApiOperation({ summary: 'Assign role to user' })
  @RequirePermission('roles.assign')
  async assignRole(
    @Param('userId') userId: string,
    @Body() data: { roleId: string },
  ) {
    return this.permissionService.assignRoleToUser(userId, data.roleId);
  }

  @Delete('users/:userId/roles/:roleId')
  @ApiOperation({ summary: 'Remove role from user' })
  @RequirePermission('roles.assign')
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.permissionService.removeRoleFromUser(userId, roleId);
  }
}
