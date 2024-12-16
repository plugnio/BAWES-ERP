import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class PermissionDiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(PermissionDiscoveryService.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Starting permission discovery...');
      await this.syncPermissions();
      this.logger.log('Permission discovery completed successfully');
    } catch (error) {
      this.logger.error('Permission discovery failed', error.stack);
      // Don't throw here as it would prevent app from starting
      // Instead, log error and let admin know they need to fix it
    }
  }

  private async syncPermissions() {
    try {
      const codePermissions = await this.discoverPermissions();
      this.logger.log(
        `Discovered ${codePermissions.length} permissions from code`,
      );

      await this.prisma.$transaction(async (tx) => {
        // Get existing permissions from DB
        const dbPermissions = await tx.permission.findMany();
        this.logger.log(
          `Found ${dbPermissions.length} existing permissions in database`,
        );

        // Add new permissions found in code
        const newPermissions = codePermissions.filter(
          (cp) => !dbPermissions.some((dp) => dp.code === cp.code),
        );

        if (newPermissions.length > 0) {
          this.logger.log(
            `Adding ${newPermissions.length} new permissions: ${newPermissions.map((p) => p.code).join(', ')}`,
          );
          await tx.permission.createMany({
            data: newPermissions,
            skipDuplicates: true,
          });

          // If SUPER_ADMIN exists, grant new permissions automatically
          const superAdmin = await tx.role.findUnique({
            where: { name: 'SUPER_ADMIN' },
          });

          if (superAdmin) {
            const createdPermissions = await tx.permission.findMany({
              where: {
                code: {
                  in: newPermissions.map((p) => p.code),
                },
              },
            });

            await tx.rolePermission.createMany({
              data: createdPermissions.map((p) => ({
                roleId: superAdmin.id,
                permissionId: p.id,
              })),
              skipDuplicates: true,
            });
          }
        }

        // Mark deprecated permissions
        const obsoletePermissions = dbPermissions.filter(
          (dp) => !codePermissions.some((cp) => cp.code === dp.code),
        );

        if (obsoletePermissions.length > 0) {
          this.logger.warn(
            `Found ${obsoletePermissions.length} deprecated permissions: ${obsoletePermissions.map((p) => p.code).join(', ')}`,
          );
          await tx.permission.updateMany({
            where: {
              code: {
                in: obsoletePermissions.map((p) => p.code),
              },
            },
            data: {
              isDeprecated: true,
            },
          });
        }

        // Log categories
        const categories = [...new Set(codePermissions.map((p) => p.category))];
        this.logger.log(`Permission categories: ${categories.join(', ')}`);
      });
    } catch (error) {
      this.logger.error('Failed to sync permissions', error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        switch (error.code) {
          case 'P2002':
            this.logger.error(
              'Unique constraint violation during permission sync',
            );
            break;
          default:
            this.logger.error(
              `Database error during permission sync: ${error.code}`,
            );
        }
      }
      throw error;
    }
  }

  private async discoverPermissions(): Promise<Prisma.PermissionCreateInput[]> {
    try {
      const permissions: Prisma.PermissionCreateInput[] = [];
      const controllers = this.discoveryService.getControllers();
      let sortOrder = 0;

      // Get last permission to calculate next bitfield
      const lastPermission = await this.prisma.permission.findFirst({
        orderBy: { bitfield: 'desc' },
      });
      let nextBitfield = lastPermission ? new Decimal(lastPermission.bitfield).mul(2) : new Decimal(1);

      controllers.forEach((wrapper) => {
        const { instance } = wrapper;
        if (!instance) return;

        const prototype = Object.getPrototypeOf(instance);
        this.metadataScanner.scanFromPrototype(
          instance,
          prototype,
          (method) => {
            try {
              const handler = instance[method];
              const permission = Reflect.getMetadata(PERMISSION_KEY, handler);

              if (permission) {
                const [category, action] = permission.split('.');
                if (!category || !action) {
                  this.logger.warn(
                    `Invalid permission format: ${permission} in ${instance.constructor.name}.${method}`,
                  );
                  return;
                }

                permissions.push({
                  code: permission,
                  name: this.formatPermissionName(action),
                  category: this.formatCategoryName(category),
                  description: `Can ${action.toLowerCase()} ${category.toLowerCase()}`,
                  sortOrder: sortOrder++,
                  isDeprecated: false,
                  bitfield: nextBitfield,
                });
                
                nextBitfield = nextBitfield.mul(2); // Double for next power of 2
              }
            } catch (error) {
              this.logger.error(
                `Failed to process permission in ${instance.constructor.name}.${method}`,
                error.stack,
              );
            }
          },
        );
      });

      // Sort permissions by category and name
      return permissions.sort((a, b) => {
        if (a.category === b.category) {
          return a.name.localeCompare(b.name);
        }
        return a.category.localeCompare(b.category);
      });
    } catch (error) {
      this.logger.error('Failed to discover permissions', error.stack);
      throw error;
    }
  }

  private formatPermissionName(str: string): string {
    return str
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private formatCategoryName(str: string): string {
    return str
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Helper method for role management UI
  async getPermissionsByCategory() {
    try {
      const permissions = await this.prisma.permission.findMany({
        where: { isDeprecated: false },
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      });

      return permissions.reduce(
        (acc, permission) => {
          if (!acc[permission.category]) {
            acc[permission.category] = [];
          }
          acc[permission.category].push(permission);
          return acc;
        },
        {} as Record<string, typeof permissions>,
      );
    } catch (error) {
      this.logger.error('Failed to get permissions by category', error.stack);
      throw error;
    }
  }
}
