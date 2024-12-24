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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { RoleService } from '../services/role.service';
import { PersonRoleService } from '../services/person-role.service';
import { CreateRoleDto } from '../dto/create-role.dto';

@ApiTags('Role Management')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoleController {
  constructor(
    private roleService: RoleService,
    private personRoleService: PersonRoleService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles with their permissions' })
  @RequirePermission('roles.read')
  async getRoles() {
    return this.roleService.getRoles(true);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @RequirePermission('roles.create')
  async createRole(@Body() data: CreateRoleDto) {
    return this.roleService.createRole(data);
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
    return this.roleService.toggleRolePermission(
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
    return this.roleService.updateRolePosition(roleId, data.position);
  }

  @Post('people/:personId/roles')
  @ApiOperation({ summary: 'Assign role to person' })
  @RequirePermission('roles.assign')
  async assignRole(
    @Param('personId') personId: string,
    @Body() data: { roleId: string },
  ) {
    return this.personRoleService.assignRole(personId, data.roleId);
  }

  @Delete('people/:personId/roles/:roleId')
  @ApiOperation({ summary: 'Remove role from person' })
  @RequirePermission('roles.assign')
  async removeRole(
    @Param('personId') personId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.personRoleService.removeRole(personId, roleId);
  }
} 