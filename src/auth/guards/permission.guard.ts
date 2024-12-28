import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../../rbac/services/permission.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import Decimal from 'decimal.js';

/**
 * Guard that checks if the current user has the required permissions to access a route.
 * Uses bitwise operations with Decimal.js for precise permission checking.
 * 
 * Permissions are stored as power-of-2 bitfields (1, 2, 4, 8, etc.) in the database.
 * Each permission gets a unique bit position.
 * User's permissions are combined into a single bitfield in their JWT token.
 * 
 * @example
 * // Single permission
 * @RequirePermissions('roles.read')
 * async getRoles() {}
 * 
 * // Multiple permissions (requires ALL)
 * @RequirePermissions(['roles.read', 'roles.update'])
 * async updateRole() {}
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);
  private readonly debugMode: boolean;

  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {
    this.debugMode = process.env.DEBUG?.toLowerCase() === 'true';
  }

  /**
   * Checks if the current user has the required permissions to access a route.
   * If no permissions are required, access is granted.
   * If permissions are required but user has no permission bits, access is denied.
   * If any required permission is missing, access is denied.
   * 
   * @param context - The execution context containing the request
   * @returns Promise<boolean> - True if access is granted, false otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const controller = context.getClass();

    if (this.debugMode) {
      this.logger.debug(`Checking permissions for ${controller.name}.${handler.name}`);
    }

    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string | string[]>(
      PERMISSIONS_KEY,
      [handler, controller],
    );

    // If no permissions required, allow access
    if (!requiredPermissions) {
      if (this.debugMode) {
        this.logger.debug('No permissions required for this route');
      }
      return true;
    }

    // Convert single permission to array for consistent handling
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    if (this.debugMode) {
      this.logger.debug(`Required permissions: ${permissions.join(', ')}`);
    }

    // Get user's permission bits from JWT token
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      if (this.debugMode) {
        this.logger.debug('No user found in request');
      }
      return false;
    }

    // Check if user is SUPER_ADMIN by checking the role bit in permissionBits
    const permissionBits = user.permissionBits;
    if (!permissionBits) {
      if (this.debugMode) {
        this.logger.debug('No permission bits found in request');
        this.logger.debug('Request user:', user);
      }
      return false;
    }

    // If user has SUPER_ADMIN bit set, allow access
    if (user.isSuperAdmin) {
      if (this.debugMode) {
        this.logger.debug('User is SUPER_ADMIN, granting access');
      }
      return true;
    }

    // Convert permission bits to Decimal for precise calculations
    const userBits = new Decimal(permissionBits);
    if (this.debugMode) {
      this.logger.debug(`User permission bits: ${userBits.toString()}`);
    }

    // Get required permission bitfields from database
    const permissionRecords = await this.permissionService.findByCode(permissions);
    if (permissionRecords.length !== permissions.length) {
      if (this.debugMode) {
        this.logger.debug(`Some required permissions don't exist: ${permissions.join(', ')}`);
        this.logger.debug('Found permissions:', permissionRecords);
      }
      return false; // Some required permissions don't exist
    }

    // Check if user has all required permissions
    // For each permission bit, check if the user has that bit set
    // This simulates: (userBits & permissionBit) === permissionBit
    for (const permission of permissionRecords) {
      const permissionBitfield = new Decimal(permission.bitfield);
      if (this.debugMode) {
        this.logger.debug(`Checking permission ${permission.code} with bitfield ${permissionBitfield.toString()}`);
      }
      
      // Bitwise AND using modulo arithmetic
      // For each bit position, we check if both numbers have a 1 in that position
      // This is equivalent to: (userBits & permissionBitfield) === permissionBitfield
      const hasPermission = userBits.mod(permissionBitfield.mul(2)).gte(permissionBitfield);
      
      if (this.debugMode) {
        this.logger.debug(`Permission check for ${permission.code}:`);
        this.logger.debug(`  userBits: ${userBits.toString()}`);
        this.logger.debug(`  permissionBitfield: ${permissionBitfield.toString()}`);
        this.logger.debug(`  hasPermission: ${hasPermission}`);
      }

      if (!hasPermission) {
        if (this.debugMode) {
          this.logger.debug(`User does not have permission ${permission.code}`);
        }
        return false;
      }
    }

    if (this.debugMode) {
      this.logger.debug('All permission checks passed');
    }
    return true;
  }
}
