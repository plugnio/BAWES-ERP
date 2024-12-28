import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { PERMISSIONS_KEY } from '../../auth/decorators/permissions.decorator';

@Injectable()
export class PermissionDiscoveryService {
  private readonly logger = new Logger(PermissionDiscoveryService.name);
  private readonly debugMode: boolean;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly prisma: PrismaService,
  ) {
    this.debugMode = process.env.DEBUG?.toLowerCase() === 'true';
  }

  /**
   * Discovers and syncs permissions from controller decorators.
   * Also ensures SUPER_ADMIN role has all permissions.
   */
  async onModuleInit() {
    if (this.debugMode) {
      this.logger.debug('Starting permission discovery...');
      this.logger.debug('Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        DEBUG: process.env.DEBUG,
      });
    }

    await this.syncPermissions();

    if (this.debugMode) {
      this.logger.debug('Permission discovery completed');
    }
  }

  /**
   * Gets all permissions grouped by category.
   * Returns an object where keys are category names and values are arrays of permissions.
   */
  async getPermissionsByCategory() {
    try {
      const permissions = await this.prisma.permission.findMany({
        where: { isDeprecated: false },
        orderBy: [
          { category: 'asc' },
          { code: 'asc' }
        ],
      });

      // Group permissions by category
      return permissions.reduce((acc, permission) => {
        const category = permission.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      }, {} as Record<string, typeof permissions>);
    } catch (error) {
      this.logger.error('Failed to get permissions by category', error.stack);
      throw error;
    }
  }

  /**
   * Discovers permissions from controller decorators.
   * @private
   */
  private async discoverPermissions() {
    const handlers = this.discoveryService.getControllers();
    const discoveredPermissions = new Set<string>();

    if (this.debugMode) {
      this.logger.debug(`Found ${handlers.length} controllers to scan`);
    }

    for (const handler of handlers) {
      const instance = handler.instance;
      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype)
        .filter(item => item !== 'constructor')
        .filter(item => typeof prototype[item] === 'function');

      if (this.debugMode) {
        this.logger.debug(`Scanning controller: ${instance.constructor.name}`);
        this.logger.debug(`Found ${methodNames.length} methods to check`);
      }

      for (const methodName of methodNames) {
        const methodRef = prototype[methodName];
        const permissions = Reflect.getMetadata(PERMISSIONS_KEY, methodRef);
        if (permissions) {
          const permArray = Array.isArray(permissions) ? permissions : [permissions];
          permArray.forEach(perm => {
            if (perm && perm.includes('.')) {
              discoveredPermissions.add(perm);
              if (this.debugMode) {
                this.logger.debug(`Discovered permission: ${perm} in ${instance.constructor.name}.${methodName}`);
              }
            } else if (this.debugMode) {
              this.logger.warn(`Invalid permission format: ${perm} in ${instance.constructor.name}.${methodName}`);
            }
          });
        }
      }
    }

    if (this.debugMode) {
      this.logger.debug(`Total permissions discovered: ${discoveredPermissions.size}`);
    }

    return Array.from(discoveredPermissions).map(code => {
      const [category, action] = code.split('.');
      return {
        code,
        category: this.formatCategoryName(category),
        name: this.formatPermissionName(action),
        description: `Permission to ${action} ${category}`,
      };
    });
  }

  /**
   * Formats a permission name to proper case.
   * Example: "READ_USER" -> "Read User"
   * @private
   */
  private formatPermissionName(name: string | undefined): string {
    if (!name) return '';
    return name
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Formats a category name to proper case.
   * Example: "USER_MANAGEMENT" -> "User Management"
   * @private
   */
  private formatCategoryName(category: string | undefined): string {
    if (!category) return '';
    return category
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Syncs discovered permissions with the database.
   * @private
   */
  private async syncPermissions() {
    try {
      const discoveredPermissions = await this.discoverPermissions();

      if (this.debugMode) {
        this.logger.debug('Starting permission sync with database');
      }

      // Start a transaction for atomicity
      await this.prisma.$transaction(async (prisma) => {
        // Get existing permissions
        const existingPermissions = await prisma.permission.findMany();
        const existingCodes = new Set(existingPermissions.map(p => p.code));

        if (this.debugMode) {
          this.logger.debug(`Found ${existingPermissions.length} existing permissions in database`);
        }

        // Find new permissions to add
        const newPermissions = discoveredPermissions
          .filter(p => !existingCodes.has(p.code));

        if (newPermissions.length > 0) {
          if (this.debugMode) {
            this.logger.debug(`Adding ${newPermissions.length} new permissions:`);
            newPermissions.forEach(p => {
              this.logger.debug(`- ${p.code} (${p.category})`);
            });
          }

          // Calculate next bitfield for each new permission
          const lastPermission = await prisma.permission.findMany({
            orderBy: { bitfield: 'desc' },
            take: 1,
          }).then(perms => perms[0]);

          let nextBitfield = lastPermission
            ? BigInt(lastPermission.bitfield.toString()) * 2n
            : 1n;

          if (this.debugMode) {
            this.logger.debug(`Starting bitfield: ${nextBitfield.toString()}`);
          }

          // Create new permissions
          for (const permission of newPermissions) {
            const created = await prisma.permission.create({
              data: {
                ...permission,
                bitfield: nextBitfield.toString(),
              },
            });
            if (this.debugMode) {
              this.logger.debug(`Created permission: ${created.code} with bitfield ${created.bitfield}`);
            }
            nextBitfield *= 2n;
          }
        }

        // Find SUPER_ADMIN role
        const superAdminRole = await prisma.role.findUnique({
          where: { name: 'SUPER_ADMIN' },
        });

        if (superAdminRole) {
          if (this.debugMode) {
            this.logger.debug('Found SUPER_ADMIN role, syncing permissions');
          }

          // Get all permissions including newly created ones
          const allPermissions = await prisma.permission.findMany({
            where: { isDeprecated: false },
          });

          // Get existing role permissions
          const existingRolePermissions = await prisma.rolePermission.findMany({
            where: { roleId: superAdminRole.id },
            select: { permissionId: true },
          });
          const existingPermissionIds = new Set(existingRolePermissions.map(rp => rp.permissionId));

          // Create role permissions for all permissions
          const rolePermissionsToAdd = allPermissions
            .filter(p => !existingPermissionIds.has(p.id))
            .map(permission => ({
              roleId: superAdminRole.id,
              permissionId: permission.id,
            }));

          if (rolePermissionsToAdd.length > 0) {
            if (this.debugMode) {
              this.logger.debug(`Assigning ${rolePermissionsToAdd.length} permissions to SUPER_ADMIN role`);
              this.logger.debug('New permissions:', rolePermissionsToAdd.map(p => p.permissionId));
            }
            await prisma.rolePermission.createMany({
              data: rolePermissionsToAdd,
              skipDuplicates: true,
            });
          }
        } else if (this.debugMode) {
          this.logger.warn('SUPER_ADMIN role not found, skipping permission assignment');
        }

        // Mark permissions as deprecated if they no longer exist in code
        const permissionsToDeprecate = existingPermissions
          .filter(p => !discoveredPermissions.some(dp => dp.code === p.code) && !p.isDeprecated);

        if (permissionsToDeprecate.length > 0) {
          if (this.debugMode) {
            this.logger.debug(`Marking ${permissionsToDeprecate.length} permissions as deprecated:`);
            permissionsToDeprecate.forEach(p => {
              this.logger.debug(`- ${p.code}`);
            });
          }
          await prisma.permission.updateMany({
            where: {
              code: {
                in: permissionsToDeprecate.map(p => p.code),
              },
            },
            data: {
              isDeprecated: true,
            },
          });
        }

        if (this.debugMode) {
          this.logger.debug('Permission sync completed successfully');
        }
      });
    } catch (error) {
      this.logger.error('Failed to sync permissions', {
        error: error.message,
        stack: error.stack,
        context: 'syncPermissions',
      });
      throw error;
    }
  }
}
