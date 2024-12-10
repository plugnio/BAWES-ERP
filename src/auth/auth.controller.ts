import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: { email: string; password: string }) {
    return this.authService.validateLogin(data.email, data.password);
  }

  @Public()
  @Post('register')
  async register(@Body() data: { 
    email: string; 
    password: string;
    nameEn?: string;
    nameAr?: string;
  }) {
    return this.authService.register(data);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() data: { refresh_token: string }) {
    return this.authService.refreshAccessToken(data.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() data: { refresh_token: string }) {
    return this.authService.revokeRefreshToken(data.refresh_token);
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() data: { email: string; code: string }) {
    return this.authService.verifyEmail(data.email, data.code);
  }
} 