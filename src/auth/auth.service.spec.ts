import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import Decimal from 'decimal.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPrisma = {
    email: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    person: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_ACCESS_TOKEN_EXPIRY: '15m',
        JWT_REFRESH_TOKEN_EXPIRY: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('validateLogin', () => {
    const mockRequest = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      cookies: {},
      res: {
        cookie: jest.fn(),
      },
    } as unknown as Request;

    it('should successfully validate login and return tokens', async () => {
      const mockEmail = {
        email: 'test@example.com',
        isVerified: true,
        person: {
          id: '1',
          passwordHash: await bcrypt.hash('password123', 10),
          accountStatus: 'active',
          roles: [
            {
              role: {
                permissions: [
                  { permission: { bitfield: '1', isDeprecated: false } },
                ],
              },
            },
          ],
          emails: [{ email: 'test@example.com' }],
        },
      };

      mockPrisma.email.findUnique.mockResolvedValue(mockEmail);
      mockPrisma.person.update.mockResolvedValue(mockEmail.person);
      mockPrisma.person.findUnique.mockResolvedValue(mockEmail.person);
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-id' });
      mockJwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.validateLogin('test@example.com', 'password123', mockRequest);

      expect(result).toBeDefined();
      expect(mockRequest.res.cookie).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockPrisma.person.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException for unverified email', async () => {
      mockPrisma.email.findUnique.mockResolvedValue({
        email: 'test@example.com',
        isVerified: false,
        person: {
          id: '1',
          passwordHash: 'hash',
          accountStatus: 'active',
        },
      });

      await expect(
        service.validateLogin('test@example.com', 'password123', mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive account', async () => {
      mockPrisma.email.findUnique.mockResolvedValue({
        email: 'test@example.com',
        isVerified: true,
        person: {
          id: '1',
          passwordHash: 'hash',
          accountStatus: 'inactive',
        },
      });

      await expect(
        service.validateLogin('test@example.com', 'password123', mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const mockEmail = {
        email: 'test@example.com',
        isVerified: true,
        person: {
          id: '1',
          passwordHash: await bcrypt.hash('correct-password', 10),
          accountStatus: 'active',
        },
      };

      mockPrisma.email.findUnique.mockResolvedValue(mockEmail);

      await expect(
        service.validateLogin('test@example.com', 'wrong-password', mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      nameEn: 'Test User',
    };

    it('should successfully register a new user', async () => {
      mockPrisma.email.findUnique.mockResolvedValue(null);
      mockPrisma.person.create.mockResolvedValue({
        id: '1',
        nameEn: registerData.nameEn,
      });
      mockPrisma.email.create.mockResolvedValue({
        email: registerData.email,
        personId: '1',
      });

      const result = await service.register(registerData);

      expect(result).toEqual({
        message: 'Registration successful. Please verify your email.',
        personId: '1',
      });
      expect(mockPrisma.person.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nameEn: registerData.nameEn,
          passwordHash: expect.any(String),
          accountStatus: 'active',
        }),
      });
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockPrisma.email.findUnique.mockResolvedValue({
        email: registerData.email,
        personId: '1',
      });

      await expect(service.register(registerData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('extractRefreshTokenFromCookie', () => {
    it('should extract refresh token from cookie', () => {
      const mockRequest = {
        cookies: {
          refreshToken: 'token-id.token-value',
        },
      } as unknown as Request;

      const result = service.extractRefreshTokenFromCookie(mockRequest);

      expect(result).toEqual({
        id: 'token-id',
        token: 'token-value',
      });
    });

    it('should return null for invalid cookie format', () => {
      const mockRequest = {
        cookies: {
          refreshToken: 'invalid-format',
        },
      } as unknown as Request;

      const result = service.extractRefreshTokenFromCookie(mockRequest);

      expect(result).toBeNull();
    });

    it('should return null when no cookie present', () => {
      const mockRequest = {
        cookies: {},
      } as unknown as Request;

      const result = service.extractRefreshTokenFromCookie(mockRequest);

      expect(result).toBeNull();
    });
  });

  describe('clearAuthCookies', () => {
    it('should clear auth cookies', () => {
      const mockRequest = {
        res: {
          clearCookie: jest.fn(),
        },
      } as unknown as Request;

      service.clearAuthCookies(mockRequest);

      expect(mockRequest.res.clearCookie).toHaveBeenCalledWith('accessToken', expect.any(Object));
      expect(mockRequest.res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
      const mockEmail = {
        id: '1',
        email: 'test@example.com',
        verificationCode: 'ABC123',
        isVerified: false,
        verificationCodeExpiresAt: new Date(Date.now() + 3600000),
      };

      mockPrisma.email.findUnique.mockResolvedValue(mockEmail);
      mockPrisma.email.update.mockResolvedValue({
        ...mockEmail,
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      });

      await service.verifyEmail('test@example.com', 'ABC123');

      expect(mockPrisma.email.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isVerified: true,
          verificationCode: null,
          verificationCodeExpiresAt: null,
        },
      });
    });

    it('should throw BadRequestException for invalid verification code', async () => {
      mockPrisma.email.findUnique.mockResolvedValue({
        verificationCode: 'ABC123',
        verificationCodeExpiresAt: new Date(Date.now() + 3600000),
      });

      await expect(
        service.verifyEmail('test@example.com', 'WRONG123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired verification code', async () => {
      mockPrisma.email.findUnique.mockResolvedValue({
        verificationCode: 'ABC123',
        verificationCodeExpiresAt: new Date(Date.now() - 3600000),
      });

      await expect(
        service.verifyEmail('test@example.com', 'ABC123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    const mockRequest = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      cookies: {
        refreshToken: 'token-id.token-value',
      },
      res: {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      },
    } as unknown as Request;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully refresh tokens', async () => {
      const mockToken = {
        id: 'token-id',
        hashedToken: await bcrypt.hash('token-value', 10),
        personId: '1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const mockPerson = {
        id: '1',
        accountStatus: 'active',
        roles: [
          {
            role: {
              permissions: [
                { permission: { bitfield: '1', isDeprecated: false } },
              ],
            },
          },
        ],
        emails: [{ email: 'test@example.com' }],
      };

      const mockTransaction = {
        refreshToken: {
          findFirst: jest.fn().mockResolvedValue(mockToken),
          update: jest.fn().mockResolvedValue({ ...mockToken, isRevoked: true }),
          create: jest.fn().mockResolvedValue({ id: 'new-token-id' }),
        },
        person: {
          findUnique: jest.fn().mockResolvedValue(mockPerson),
        },
      };

      mockPrisma.$transaction.mockImplementation((callback) => callback(mockTransaction));
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken(mockRequest);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new-access-token');
      expect(result.tokenType).toBe('Bearer');
      expect(mockRequest.res.cookie).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const mockTransaction = {
        refreshToken: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      mockPrisma.$transaction.mockImplementation((callback) => callback(mockTransaction));

      await expect(service.refreshToken(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockRequest.res.clearCookie).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      const mockTransaction = {
        refreshToken: {
          findFirst: jest.fn().mockResolvedValue(null), // Revoked tokens are filtered in the query
        },
      };

      mockPrisma.$transaction.mockImplementation((callback) => callback(mockTransaction));

      await expect(service.refreshToken(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockRequest.res.clearCookie).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const mockTransaction = {
        refreshToken: {
          findFirst: jest.fn().mockResolvedValue(null), // Expired tokens are filtered in the query
        },
      };

      mockPrisma.$transaction.mockImplementation((callback) => callback(mockTransaction));

      await expect(service.refreshToken(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockRequest.res.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should successfully revoke token', async () => {
      const tokenId = 'token-id';
      const tokenValue = 'token-value';
      const tokenString = `${tokenId}.${tokenValue}`;

      const mockToken = {
        id: tokenId,
        hashedToken: await bcrypt.hash(tokenValue, 10),
        personId: '1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockToken);
      mockPrisma.refreshToken.update.mockResolvedValue({ ...mockToken, isRevoked: true });

      const result = await service.revokeRefreshToken(tokenString);

      expect(result).toEqual({ message: 'Token revoked successfully' });
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: tokenId },
        data: {
          isRevoked: true,
          revokedReason: 'Manual logout',
          lastUsedAt: expect.any(Date),
        },
      });
    });

    it('should handle invalid token format', async () => {
      await expect(service.revokeRefreshToken('invalid-format'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should handle non-existent token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);
      
      await expect(service.revokeRefreshToken('token-id.token-value'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should handle invalid token value', async () => {
      const tokenId = 'token-id';
      const correctToken = 'correct-token';
      const wrongToken = 'wrong-token';
      
      const mockToken = {
        id: tokenId,
        hashedToken: await bcrypt.hash(correctToken, 10),
        personId: '1',
        isRevoked: false,
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockToken);
      
      await expect(service.revokeRefreshToken(`${tokenId}.${wrongToken}`))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a person', async () => {
      const personId = '1';
      
      await service.revokeAllUserTokens(personId);

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          personId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedReason: 'Manual revocation of all tokens',
        },
      });
    });

    it('should accept custom revocation reason', async () => {
      const personId = '1';
      const customReason = 'Security breach';
      
      await service.revokeAllUserTokens(personId, customReason);

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          personId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedReason: customReason,
        },
      });
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired and revoked tokens', async () => {
      jest.useFakeTimers();
      const now = new Date('2024-01-01T00:00:00Z');
      jest.setSystemTime(now);

      await service.cleanupExpiredTokens();

      // Should mark expired tokens as revoked
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: now },
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedReason: 'Token expired during cleanup',
        },
      });

      // Should delete very old tokens
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: thirtyDaysAgo },
        },
      });

      jest.useRealTimers();
    });
  });

  describe('debug mode', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
      process.env.DEBUG = 'false';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should log debug information when DEBUG is true', () => {
      process.env.DEBUG = 'true';
      const service = new AuthService(prisma, jwtService, configService);
      const loggerSpy = jest.spyOn(service['logger'], 'debug');
      
      const mockRequest = {
        cookies: { refreshToken: 'test.token' },
      } as unknown as Request;

      service.extractRefreshTokenFromCookie(mockRequest);

      expect(loggerSpy).toHaveBeenCalledWith('Cookies received:', { refreshToken: 'test.token' });
    });

    it('should not log debug information when DEBUG is false', () => {
      process.env.DEBUG = 'false';
      const service = new AuthService(prisma, jwtService, configService);
      const loggerSpy = jest.spyOn(service['logger'], 'debug');
      
      const mockRequest = {
        cookies: { refreshToken: 'test.token' },
      } as unknown as Request;

      service.extractRefreshTokenFromCookie(mockRequest);

      expect(loggerSpy).not.toHaveBeenCalled();
    });
  });
}); 