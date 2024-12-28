import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(
    private prisma: PrismaService,
  ) {}

  /**
   * Formats a category name to PascalCase.
   * Example: "user_management" -> "UserManagement"
   */
  private formatCategoryName(category: string): string {
    return category
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  async getPermissionCategories() {
    const permissions = await this.prisma.permission.findMany({
      where: { isDeprecated: false },
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });

    // Group permissions by category
    const categories = permissions.reduce(
      (acc, permission) => {
        const categoryName = this.formatCategoryName(permission.category);
        const category = acc.find((c) => c.name === categoryName);
        if (category) {
          category.permissions.push({
            ...permission,
            category: categoryName,
            code: permission.code.toLowerCase(),
          });
        } else {
          acc.push({
            name: categoryName,
            permissions: [{
              ...permission,
              category: categoryName,
              code: permission.code.toLowerCase(),
            }],
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

  async findByCode(codes: string[]) {
    return this.prisma.permission.findMany({
      where: {
        code: {
          in: codes,
        },
      },
    });
  }

  async getPerson(id: string) {
    return this.prisma.person.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }
} 