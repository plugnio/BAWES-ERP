import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(
    private prisma: PrismaService,
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