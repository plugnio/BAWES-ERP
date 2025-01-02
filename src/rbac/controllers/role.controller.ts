import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { RoleService } from '../services/role.service';
import { PersonRoleService } from '../services/person-role.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly personRoleService: PersonRoleService,
  ) {}

  @Post()
  @RequirePermissions('roles.create')
  @ApiOperation({ summary: 'Create a new role' })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.createRole(createRoleDto);
  }

  @Get()
  @RequirePermissions('roles.read')
  @ApiOperation({ summary: 'Get all roles' })
  async getRoles() {
    return this.roleService.getRoles(true);
  }

  @Get(':id')
  @RequirePermissions('roles.read')
  @ApiOperation({ summary: 'Get a role by ID' })
  async getRole(@Param('id') id: string) {
    return this.roleService.getRoleWithPermissions(id);
  }

  @Patch(':id')
  @RequirePermissions('roles.update')
  @ApiOperation({ summary: 'Update a role' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.roleService.updateRole(id, updateRoleDto);
  }

  @Patch(':roleId/position')
  @RequirePermissions('roles.update')
  @ApiOperation({ summary: 'Update role position' })
  async updatePosition(
    @Param('roleId') roleId: string,
    @Body() data: { position: number },
  ) {
    return this.roleService.updateRolePosition(roleId, data.position);
  }

  @Patch(':roleId/permissions')
  @RequirePermissions('roles.update')
  @ApiOperation({ summary: 'Toggle role permissions' })
  async togglePermissions(
    @Param('roleId') roleId: string,
    @Body() data: { permissionCode: string; enabled: boolean },
  ) {
    return this.roleService.toggleRolePermission(
      roleId,
      data.permissionCode,
      data.enabled,
    );
  }

  @Delete(':id')
  @RequirePermissions('roles.delete')
  @ApiOperation({ summary: 'Delete a role' })
  async deleteRole(@Param('id') id: string) {
    return this.roleService.deleteRole(id);
  }

  @Post(':roleId/assign/:personId')
  @RequirePermissions('roles.assign')
  @ApiOperation({ summary: 'Assign a role to a person' })
  async assignRole(
    @Param('roleId') roleId: string,
    @Param('personId') personId: string,
  ) {
    return this.personRoleService.assignRole(personId, roleId);
  }

  @Delete(':roleId/unassign/:personId')
  @RequirePermissions('roles.assign')
  @ApiOperation({ summary: 'Unassign a role from a person' })
  async unassignRole(
    @Param('roleId') roleId: string,
    @Param('personId') personId: string,
  ) {
    return this.personRoleService.removeRole(personId, roleId);
  }
} 