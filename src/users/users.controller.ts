import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { InviteUserDto } from './dto/invite-user.dto';

@Controller('users')
export class UsersController {
  @Post('invite')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('CREATE:INVITE')
  async inviteUser(@Body() inviteDto: InviteUserDto) {
    // Only users with CREATE:INVITE permission can access this endpoint
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('READ:USER')
  async getUsers() {
    // Only users with READ:USER permission can access this endpoint
  }
} 