import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RbacCacheService } from './rbac-cache.service';

@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    private cacheService: RbacCacheService,
  ) {}

  async getRoles(includePermissions = false) {
    return this.prisma.role.findMany({
      include: {
        permissions: includePermissions
          ? {
              include: { permission: true },
            }
          : false,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getRoleWithPermissions(roleId: string) {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async createRole(data: CreateRoleDto) {
    // Check for existing role with same name
    const existingRole = await this.prisma.role.findFirst({
      where: { name: data.name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    // Create role and assign permissions in a transaction
    const role = await this.prisma.$transaction(async (prisma) => {
      const newRole = await prisma.role.create({
        data: {
          name: data.name,
          description: data.description,
          isSystem: false,
          sortOrder: await this.getNextRolePosition(),
        },
      });

      if (data.permissions?.length) {
        const permissions = await prisma.permission.findMany({
          where: {
            code: {
              in: data.permissions,
            },
          },
        });

        await prisma.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: newRole.id,
            permissionId: permission.id,
          })),
        });
      }

      // Return role with permissions
      return prisma.role.findUnique({
        where: { id: newRole.id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    return role;
  }

  async updateRolePosition(roleId: string, newPosition: number) {
    const roles = await this.prisma.role.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const updates = roles.map((role, index) => {
      let sortOrder = index;
      if (role.id === roleId) {
        sortOrder = newPosition;
      } else if (index >= newPosition) {
        sortOrder = index + 1;
      }

      return this.prisma.role.update({
        where: { id: role.id },
        data: { sortOrder },
      });
    });

    await this.prisma.$transaction(updates);
    return this.getRoles(true);
  }

  async toggleRolePermission(
    roleId: string,
    permissionCode: string,
    enabled: boolean,
  ) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system roles');
    }

    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (enabled) {
      await this.prisma.rolePermission.create({
        data: {
          roleId,
          permissionId: permission.id,
        },
      });
    } else {
      await this.prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId: permission.id,
        },
      });
    }

    // Clear cache for all users with this role
    await this.cacheService.clearPermissionCache(roleId);

    // Wait for cache to be cleared before returning
    await new Promise(resolve => setTimeout(resolve, 100));

    return this.getRoleWithPermissions(roleId);
  }

  async updateRole(roleId: string, data: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system roles');
    }

    // Check for name conflict if name is being updated
    if (data.name && data.name !== role.name) {
      const existingRole = await this.prisma.role.findFirst({
        where: { name: data.name },
      });

      if (existingRole) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder,
      },
    });

    // Clear cache for all users with this role
    await this.cacheService.clearPermissionCache(roleId);

    return this.getRoleWithPermissions(updatedRole.id);
  }

  async deleteRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete system roles');
    }

    // Delete role permissions first
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Delete person role assignments
    await this.prisma.personRole.deleteMany({
      where: { roleId },
    });

    // Delete the role
    await this.prisma.role.delete({
      where: { id: roleId },
    });

    // Clear cache for all users with this role
    await this.cacheService.clearPermissionCache(roleId);

    return { success: true };
  }

  private async getNextRolePosition() {
    const lastRole = await this.prisma.role.findFirst({
      orderBy: { sortOrder: 'desc' },
    });
    return lastRole ? lastRole.sortOrder + 1 : 0;
  }
} 