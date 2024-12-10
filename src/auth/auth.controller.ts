import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: { email: string; password: string }) {
    return this.authService.validateLogin(data.email, data.password);
  }

  @Post('register')
  async register(@Body() data: { 
    email: string; 
    password: string;
    nameEn?: string;
    nameAr?: string;
  }) {
    return this.authService.register(data);
  }

  @Post('verify-email')
  async verifyEmail(@Body() data: { email: string; code: string }) {
    return this.authService.verifyEmail(data.email, data.code);
  }
} 