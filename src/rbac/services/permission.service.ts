import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getPermissionCategories() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });

    // Group permissions by category
    const categories = permissions.reduce(
      (acc, permission) => {
        const category = acc.find((c) => c.name === permission.category);
        if (category) {
          category.permissions.push(permission);
        } else {
          acc.push({
            name: permission.category,
            permissions: [permission],
          });
        }
        return acc;
      },
      [] as { name: string; permissions: any[] }[],
    );

    return categories;
  }

  async createPermission(data: {
    code: string;
    name: string;
    category: string;
    description?: string;
  }) {
    // Calculate next bitfield
    const lastPermission = await this.prisma.permission.findFirst({
      orderBy: { bitfield: 'desc' },
    });

    const bitfield = lastPermission
      ? (BigInt(lastPermission.bitfield.toString()) * 2n).toString()
      : '1';

    return this.prisma.permission.create({
      data: {
        ...data,
        bitfield,
      },
    });
  }

  async getPermissionDashboard() {
    const [categories, roles] = await Promise.all([
      this.getPermissionCategories(),
      this.prisma.role.findMany({
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      }),
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