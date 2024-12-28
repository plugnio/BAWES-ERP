import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacCacheService } from './rbac-cache.service';
import Decimal from 'decimal.js';

@Injectable()
export class PersonRoleService {
  constructor(
    private prisma: PrismaService,
    private cacheService: RbacCacheService,
  ) {}

  async assignRole(personId: string, roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    await this.prisma.personRole.create({
      data: {
        personId,
        roleId,
      },
    });

    // Clear person's permission cache
    await this.cacheService.clearPersonPermissionCache(personId);

    return this.getPersonRoles(personId);
  }

  async removeRole(personId: string, roleId: string) {
    await this.prisma.personRole.delete({
      where: {
        personId_roleId: {
          personId,
          roleId,
        },
      },
    });

    // Clear person's permission cache
    await this.cacheService.clearPersonPermissionCache(personId);

    return this.getPersonRoles(personId);
  }

  async getPersonRoles(personId: string) {
    return this.prisma.person.findUnique({
      where: { id: personId },
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

  async getRoleMembers(roleId: string) {
    return this.prisma.personRole.findMany({
      where: { roleId },
      include: {
        person: true,
      },
    });
  }

  async calculateEffectivePermissions(personId: string) {
    // Check cache first
    const cached = await this.cacheService.getCachedPersonPermissions(personId);
    if (cached) {
      // Ensure cached value is a string before converting to Decimal
      return new Decimal(cached.toString());
    }

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

    if (!person) {
      return new Decimal(0);
    }

    // Combine all permission bitfields using Decimal
    const permissions = person.roles.reduce((acc, role) => {
      const roleBitfield = role.role.permissions.reduce(
        (roleAcc, perm) => roleAcc.add(new Decimal(perm.permission.bitfield)),
        new Decimal(0),
      );
      return acc.add(roleBitfield);
    }, new Decimal(0));

    // Cache the result
    await this.cacheService.setCachedPersonPermissions(personId, permissions.toString());

    return permissions;
  }

  async hasPermission(
    personId: string,
    permissionCode: string,
  ): Promise<boolean> {
    const [personPermissions, permission] = await Promise.all([
      this.calculateEffectivePermissions(personId),
      this.prisma.permission.findUnique({
        where: { code: permissionCode },
      }),
    ]);

    if (!permission) {
      return false;
    }

    const permissionBitfield = new Decimal(permission.bitfield);
    return personPermissions.mod(permissionBitfield.mul(2)).gte(permissionBitfield);
  }

  async hasRole(personId: string, roleName: string): Promise<boolean> {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!person) {
      return false;
    }

    return person.roles.some(pr => pr.role.name === roleName);
  }
} 