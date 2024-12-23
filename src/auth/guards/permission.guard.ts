import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../../rbac/services/permission.service';
import { PersonRoleService } from '../../rbac/services/person-role.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private personRoleService: PersonRoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const personId = request.user?.id;

    if (!personId) {
      return false;
    }

    // Check each required permission
    for (const permission of requiredPermissions) {
      const hasPermission = await this.personRoleService.hasPermission(
        personId,
        permission,
      );

      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }
}
