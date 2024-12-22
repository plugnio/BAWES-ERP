import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import Decimal from 'decimal.js';

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

      this.logger.debug('Required permission:', requiredPermission);

      if (!requiredPermission) return true;

      const request = context.switchToHttp().getRequest();
      this.logger.debug('Request user:', request.user);
      this.logger.debug('Request headers:', request.headers);

      const personId = request.user?.id;
      const permissionBits = request.user?.permissionBits;

      this.logger.debug(`Checking permission: ${requiredPermission}`);
      this.logger.debug(`User ID: ${personId}`);
      this.logger.debug(`Permission Bits: ${permissionBits}`);

      if (!personId) {
        this.logger.warn('No user ID found in request');
        throw new UnauthorizedException('User not authenticated');
      }

      // Try to get permissions from cache
      const cacheKey = `permissions:${personId}`;
      let hasPermission = await this.cacheManager.get<boolean>(
        `${cacheKey}:${requiredPermission}`,
      );

      if (hasPermission !== undefined) {
        this.logger.debug(`Using cached permission: ${hasPermission}`);
        return hasPermission;
      }

      // Get permission bitfield from database
      const permission = await this.prisma.permission.findUnique({
        where: { code: requiredPermission },
        select: { bitfield: true, isDeprecated: true },
      });

      this.logger.debug(`Permission from DB:`, permission);

      if (!permission || permission.isDeprecated) {
        this.logger.warn(
          `Permission not found or deprecated: ${requiredPermission}`,
        );
        return false;
      }

      // Get person with roles and their permissions
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
        this.logger.warn(`User not found: ${personId}`);
        throw new UnauthorizedException('User not found');
      }

      this.logger.debug(`User roles:`, person.roles.map(r => r.role.name));

      // Super admin check
      const isSuperAdmin = person.roles.some(
        (pr) => pr.role.name === 'SUPER_ADMIN',
      );

      this.logger.debug(`Is Super Admin: ${isSuperAdmin}`);

      if (isSuperAdmin) {
        await this.cacheManager.set(
          `${cacheKey}:${requiredPermission}`,
          true,
          this.CACHE_TTL,
        );
        return true;
      }

      // Use permissionBits from JWT token
      const userBits = new Decimal(permissionBits || '0');
      const permissionBitfield = new Decimal(permission.bitfield);

      this.logger.debug(`User bits: ${userBits.toString()}`);
      this.logger.debug(`Permission bitfield: ${permissionBitfield.toString()}`);

      // Check if user has the required permission using bitwise operations
      // For bitwise operations with Decimal, we need to use modulo 2 division to simulate AND
      const divided = userBits.dividedToIntegerBy(permissionBitfield);
      const modulo = divided.modulo(2);
      hasPermission = modulo.equals(1);

      this.logger.debug(`Division result: ${divided.toString()}`);
      this.logger.debug(`Modulo result: ${modulo.toString()}`);
      this.logger.debug(`Has permission: ${hasPermission}`);

      // Cache the result
      await this.cacheManager.set(
        `${cacheKey}:${requiredPermission}`,
        hasPermission,
        this.CACHE_TTL,
      );

      if (!hasPermission) {
        this.logger.warn(
          `Permission denied: ${requiredPermission} for user ${personId}`,
        );
        throw new UnauthorizedException('Insufficient permissions');
      }

      return hasPermission;
    } catch (error) {
      this.logger.error(
        `Permission check failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
