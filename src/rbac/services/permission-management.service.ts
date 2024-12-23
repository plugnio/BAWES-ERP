import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import Decimal from 'decimal.js';

@Injectable()
export class PermissionManagementService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getPermissionCategories() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    // Group permissions by category
    const categories = permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.category]) {
          acc[permission.category] = {
            name: permission.category,
            permissions: [],
          };
        }
        acc[permission.category].permissions.push(permission);
        return acc;
      },
      {} as Record<string, { name: string; permissions: any[] }>,
    );

    return Object.values(categories);
  }

  async getPermissionDashboard() {
    const [categories, roles] = await Promise.all([
      this.getPermissionCategories(),
      this.getRoles(true),
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

  async createPermissionCategory(data: {
    name: string;
    description?: string;
    sortOrder?: number;
  }) {
    // Since categories are just strings in the Permission model,
    // we'll return the category info without creating a record
    return {
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder,
      permissions: [],
    };
  }

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

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    // Delete existing permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Add new permissions
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    });

    return this.getRoleWithPermissions(roleId);
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

  async calculateEffectivePermissions(personId: string) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    // Combine all permission bitfields using Decimal
    return person.roles.reduce((acc, role) => {
      const roleBitfield = role.role.permissions.reduce(
        (roleAcc, perm) => roleAcc.add(new Decimal(perm.permission.bitfield)),
        new Decimal(0),
      );
      return acc.add(roleBitfield);
    }, new Decimal(0));
  }

  async hasPermission(
    personId: string,
    permissionCode: string,
  ): Promise<boolean> {
    const [userPermissions, permission] = await Promise.all([
      this.calculateEffectivePermissions(personId),
      this.prisma.permission.findUnique({
        where: { code: permissionCode },
      }),
    ]);

    if (!permission) {
      return false;
    }

    const permissionBitfield = new Decimal(permission.bitfield);
    return userPermissions.dividedBy(permissionBitfield).modulo(2).equals(1);
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

    // Clear user permission cache for all users with this role
    await this.clearPermissionCache(roleId);

    return this.getRoleWithPermissions(roleId);
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

  async assignRoleToUser(userId: string, roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    await this.prisma.personRole.create({
      data: {
        personId: userId,
        roleId,
      },
    });

    // Clear user's permission cache
    await this.clearUserPermissionCache(userId);

    return this.getUserRoles(userId);
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    await this.prisma.personRole.delete({
      where: {
        personId_roleId: {
          personId: userId,
          roleId,
        },
      },
    });

    // Clear user's permission cache
    await this.clearUserPermissionCache(userId);

    return this.getUserRoles(userId);
  }

  private async getNextRolePosition(): Promise<number> {
    const maxRole = await this.prisma.role.findFirst({
      orderBy: { sortOrder: 'desc' },
    });
    return (maxRole?.sortOrder ?? -1) + 1;
  }

  private async clearPermissionCache(roleId: string) {
    const usersWithRole = await this.prisma.personRole.findMany({
      where: { roleId },
    });

    await Promise.all(
      usersWithRole.map((ur) => this.clearUserPermissionCache(ur.personId)),
    );
  }

  private async clearUserPermissionCache(userId: string) {
    await this.cacheManager.del(`user-permissions:${userId}`);
  }

  async getUserRoles(userId: string) {
    return this.prisma.person.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
