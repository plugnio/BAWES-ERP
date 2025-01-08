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
} 