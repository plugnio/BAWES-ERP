import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../../src/auth/decorators/permissions.decorator';

@Controller('test')
export class TestController {
  @Get()
  @RequirePermissions('test.read')
  async testRead() {
    return { message: 'Test read' };
  }

  @Get('write')
  @RequirePermissions('test.write')
  async testWrite() {
    return { message: 'Test write' };
  }

  @Get('manage')
  @RequirePermissions('test.manage')
  async testManage() {
    return { message: 'Test manage' };
  }

  @Get('users')
  @RequirePermissions('users.read')
  async testUsers() {
    return { message: 'Test users' };
  }

  @Get('roles')
  @RequirePermissions('roles.read')
  async testRoles() {
    return { message: 'Test roles' };
  }

  @Get('permissions')
  @RequirePermissions('permissions.read')
  async testPermissions() {
    return { message: 'Test permissions' };
  }
} 