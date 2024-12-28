import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    authService = {
      validateLogin: jest.fn(),
      register: jest.fn(),
      refreshToken: jest.fn(),
      extractRefreshTokenFromCookie: jest.fn(),
      revokeRefreshToken: jest.fn(),
      clearAuthCookies: jest.fn(),
      verifyEmail: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call validateLogin with correct parameters', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockRequest = { headers: {} } as Request;
      const expectedResult = {
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      authService.validateLogin.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, mockRequest);

      expect(result).toBe(expectedResult);
      expect(authService.validateLogin).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        mockRequest,
      );
    });
  });

  describe('register', () => {
    it('should call register with correct parameters', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = {
        message: 'Registration successful',
        personId: 'user-id',
      };

      authService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toBe(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('refresh', () => {
    it('should call refreshToken with request object', async () => {
      const mockRequest = { headers: {} } as Request;
      const expectedResult = {
        accessToken: 'new-jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      authService.refreshToken.mockResolvedValue(expectedResult);

      const result = await controller.refresh(mockRequest);

      expect(result).toBe(expectedResult);
      expect(authService.refreshToken).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('logout', () => {
    it('should handle logout with valid refresh token', async () => {
      const mockRequest = { headers: {} } as Request;
      const mockTokenData = { id: 'token-id', token: 'refresh-token' };

      authService.extractRefreshTokenFromCookie.mockReturnValue(mockTokenData);

      const result = await controller.logout(mockRequest);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(authService.revokeRefreshToken).toHaveBeenCalledWith('token-id.refresh-token');
      expect(authService.clearAuthCookies).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle logout without refresh token', async () => {
      const mockRequest = { headers: {} } as Request;

      authService.extractRefreshTokenFromCookie.mockReturnValue(null);

      const result = await controller.logout(mockRequest);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(authService.revokeRefreshToken).not.toHaveBeenCalled();
      expect(authService.clearAuthCookies).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('verifyEmail', () => {
    it('should call verifyEmail with correct parameters', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        email: 'test@example.com',
        code: '123456',
      };
      const expectedResult = { message: 'Email verified' };

      authService.verifyEmail.mockResolvedValue(expectedResult);

      const result = await controller.verifyEmail(verifyEmailDto);

      expect(result).toBe(expectedResult);
      expect(authService.verifyEmail).toHaveBeenCalledWith(
        verifyEmailDto.email,
        verifyEmailDto.code,
      );
    });
  });
}); 