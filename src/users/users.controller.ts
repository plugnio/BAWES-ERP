import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { InviteUserDto } from './dto/invite-user.dto';

@Controller('users')
export class UsersController {
  @Post('invite')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('User:Invite')
  async inviteUser(@Body() inviteDto: InviteUserDto) {
    // Only users with User:Invite permission can access this endpoint
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('User:Read')
  async getUsers() {
    // Only users with User:Read permission can access this endpoint
  }
} 