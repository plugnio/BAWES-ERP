import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionManagementService {
  constructor(private prisma: PrismaService) {}

  async getPermissionCategories() {
    return this.prisma.permissionCategory.findMany({
      include: {
        permissions: {
          orderBy: { code: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async createPermissionCategory(data: {
    name: string;
    description?: string;
    sortOrder?: number;
  }) {
    return this.prisma.permissionCategory.create({ data });
  }

  async createPermission(data: {
    code: string;
    name: string;
    description?: string;
    categoryId: string;
  }) {
    // Auto-generate next available bitfield
    const lastPermission = await this.prisma.permission.findFirst({
      orderBy: { bitfield: 'desc' }
    });

    const bitfield = lastPermission 
      ? lastPermission.bitfield << BigInt(1)
      : BigInt(1);

    return this.prisma.permission.create({
      data: { ...data, bitfield }
    });
  }

  async getRoles(includePermissions = false) {
    return this.prisma.role.findMany({
      include: {
        permissions: includePermissions ? {
          include: { permission: true }
        } : false
      },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    // Delete existing permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId }
    });

    // Add new permissions
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map(permissionId => ({
        roleId,
        permissionId
      }))
    });

    return this.getRoleWithPermissions(roleId);
  }

  async getRoleWithPermissions(roleId: string) {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
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
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    // Combine all permission bitfields
    return person.roles.reduce((acc, role) => {
      const roleBitfield = role.role.permissions.reduce(
        (roleAcc, perm) => roleAcc | perm.permission.bitfield,
        BigInt(0)
      );
      return acc | roleBitfield;
    }, BigInt(0));
  }

  async hasPermission(personId: string, permissionCode: string): Promise<boolean> {
    const [userPermissions, permission] = await Promise.all([
      this.calculateEffectivePermissions(personId),
      this.prisma.permission.findUnique({
        where: { code: permissionCode }
      })
    ]);

    if (!permission) {
      return false;
    }

    return (userPermissions & permission.bitfield) === permission.bitfield;
  }
} 