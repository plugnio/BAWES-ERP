import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from '../dto/create-role.dto';
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
    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        isSystem: false,
        sortOrder: await this.getNextRolePosition(),
      },
    });

    if (data.permissions?.length) {
      const permissions = await this.prisma.permission.findMany({
        where: {
          code: {
            in: data.permissions,
          },
        },
      });

      await this.prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      });
    }

    return this.getRoleWithPermissions(role.id);
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

  private async getNextRolePosition(): Promise<number> {
    const maxRole = await this.prisma.role.findFirst({
      orderBy: { sortOrder: 'desc' },
    });
    return (maxRole?.sortOrder ?? -1) + 1;
  }
} 