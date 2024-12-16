import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  NotImplementedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { InviteUserDto } from './dto/invite-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  @Post('invite')
  @RequirePermission('users.invite')
  async inviteUser(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() inviteDto: InviteUserDto,
  ) {
    // TODO: Implement user invitation
    throw new NotImplementedException();
  }

  @Get()
  @RequirePermission('users.read')
  async getUsers() {
    // TODO: Implement get users
    throw new NotImplementedException();
  }
}
