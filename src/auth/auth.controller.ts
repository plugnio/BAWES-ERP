import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() data: { email: string; password: string },
    @Req() req: Request
  ) {
    return this.authService.validateLogin(data.email, data.password, req);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
        nameEn: { type: 'string', example: 'John Doe' },
        nameAr: { type: 'string', example: 'جون دو' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() data: { refresh_token: string },
    @Req() req: Request
  ) {
    return this.authService.refreshAccessToken(data.refresh_token, req);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Body() data: { refresh_token: string }) {
    return this.authService.revokeRefreshToken(data.refresh_token);
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        code: { type: 'string', example: '123456' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async verifyEmail(@Body() data: { email: string; code: string }) {
    return this.authService.verifyEmail(data.email, data.code);
  }
} 