import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const requiredPermission = this.reflector.get<string>(
        PERMISSION_KEY,
        context.getHandler(),
      );

      if (!requiredPermission) return true;

      const request = context.switchToHttp().getRequest();
      const personId = request.user?.id;

      if (!personId) {
        throw new UnauthorizedException('User not authenticated');
      }

      // Try to get permissions from cache
      const cacheKey = `permissions:${personId}`;
      let hasPermission = await this.cacheManager.get<boolean>(
        `${cacheKey}:${requiredPermission}`
      );

      if (hasPermission !== undefined) {
        return hasPermission;
      }

      // Get person with roles and their permissions
      const person = await this.prisma.person.findUnique({
        where: { id: personId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: {
                        select: {
                          code: true,
                          isDeprecated: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!person) {
        throw new UnauthorizedException('User not found');
      }

      // Super admin check
      const isSuperAdmin = person.roles.some(pr => pr.role.name === 'SUPER_ADMIN');
      if (isSuperAdmin) {
        await this.cacheManager.set(
          `${cacheKey}:${requiredPermission}`,
          true,
          this.CACHE_TTL
        );
        return true;
      }

      // Check specific permissions
      hasPermission = person.roles.some(pr => 
        pr.role.permissions.some(rp => 
          rp.permission.code === requiredPermission && !rp.permission.isDeprecated
        )
      );

      // Cache the result
      await this.cacheManager.set(
        `${cacheKey}:${requiredPermission}`,
        hasPermission,
        this.CACHE_TTL
      );

      if (!hasPermission) {
        this.logger.warn(`Permission denied: ${requiredPermission} for user ${personId}`);
        throw new UnauthorizedException('Insufficient permissions');
      }

      return hasPermission;
    } catch (error) {
      this.logger.error(`Permission check failed: ${error.message}`, error.stack);
      throw error;
    }
  }
} 