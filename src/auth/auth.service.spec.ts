import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RbacCacheService } from '../rbac/services/rbac-cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { Request } from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrismaService: DeepMockProxy<PrismaService>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockRbacCacheService: jest.Mocked<RbacCacheService>;

  beforeEach(async () => {
    mockPrismaService = mockDeep<PrismaService>();
    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
      options: {},
      logger: new Logger(),
    } as unknown as jest.Mocked<JwtService>;

    mockConfigService = {
      get: jest.fn(),
      getOrThrow: jest.fn().mockReturnValue('7d'),
    } as unknown as jest.Mocked<ConfigService>;

    mockRbacCacheService = {
      getCachedPersonPermissions: jest.fn(),
      setCachedPersonPermissions: jest.fn(),
      clearCacheForPerson: jest.fn(),
      clearCacheForRole: jest.fn(),
      clearPermissionCache: jest.fn(),
      clearPersonPermissionCache: jest.fn(),
      getPermissionCacheTTL: jest.fn(),
    } as unknown as jest.Mocked<RbacCacheService>;

    service = new AuthService(
      mockPrismaService,
      mockJwtService,
      mockConfigService,
      mockRbacCacheService,
    );
  });

  describe('generateTokens', () => {
    const mockRequest = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      cookies: {},
      res: {
        cookie: jest.fn(),
      },
    } as unknown as Request;

    beforeEach(() => {
      process.env.DEBUG = 'false';
      jest.clearAllMocks();
    });

    it('should handle debug mode logging', async () => {
      process.env.DEBUG = 'true';
      const personId = '1';
      const mockPerson = {
        id: personId,
        createdAt: new Date(),
        updatedAt: new Date(),
        nameEn: 'Test User',
        nameAr: 'مستخدم اختبار',
        passwordHash: 'hash',
        lastLoginAt: new Date(),
        accountStatus: 'active',
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
        isDeleted: false,
        roles: [
          {
            role: {
              name: 'USER',
              permissions: [
                {
                  permission: {
                    code: 'users.read',
                    bitfield: '1',
                    isDeprecated: false,
                  },
                },
              ],
            },
          },
        ],
        emails: [{ email: 'test@example.com' }],
      };

      mockPrismaService.person.findUnique.mockResolvedValue(mockPerson);
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        personId: '1',
        hashedToken: 'hashed-token',
        deviceDetails: 'test-agent',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(),
        isRevoked: false,
        revokedReason: null,
        lastUsedAt: new Date(),
      });
      mockJwtService.sign.mockReturnValue('mock-access-token');
      mockRbacCacheService.getCachedPersonPermissions.mockResolvedValue(null);

      // Create a new instance of AuthService with debug mode enabled
      const debugService = new AuthService(
        mockPrismaService,
        mockJwtService,
        mockConfigService,
        mockRbacCacheService,
      );

      const loggerSpy = jest.spyOn(debugService['logger'], 'debug');

      await debugService['generateTokens'](personId, mockRequest);

      expect(loggerSpy).toHaveBeenCalledWith('Person roles:', expect.any(String));
      expect(loggerSpy).toHaveBeenCalledWith('Processing role USER');
      expect(loggerSpy).toHaveBeenCalledWith('Adding permission users.read with bitfield 1');
      expect(loggerSpy).toHaveBeenCalledWith('Role USER combined bits: 1');
      expect(loggerSpy).toHaveBeenCalledWith('Cached new permission bits: 1');
    });

    // ... rest of generateTokens tests ...
  });

  describe('getDurationInMs', () => {
    it('should convert duration string to milliseconds', () => {
      expect(service['getDurationInMs']('1d')).toBe(86400000);
      expect(service['getDurationInMs']('1h')).toBe(3600000);
      expect(service['getDurationInMs']('30m')).toBe(1800000);
      expect(service['getDurationInMs']('1s')).toBe(1000);
      expect(service['getDurationInMs']('500ms')).toBe(500);
    });

    it('should handle invalid duration string', () => {
      expect(() => service['getDurationInMs']('invalid')).toThrow('Invalid duration format: invalid');
      expect(() => service['getDurationInMs']('abc123')).toThrow('Invalid duration format: abc123');
      expect(() => service['getDurationInMs']('xyz')).toThrow('Invalid duration format: xyz');
    });
  });

  describe('validateLogin', () => {
    it('should successfully validate login credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockRequest = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        cookies: {},
        res: { cookie: jest.fn() },
      } as unknown as Request;

      const mockPerson = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        nameEn: 'Test User',
        nameAr: 'مستخدم اختبار',
        passwordHash: await bcrypt.hash(password, 10),
        lastLoginAt: new Date(),
        accountStatus: 'active',
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
        isDeleted: false,
        roles: [
          {
            role: {
              name: 'USER',
              permissions: [
                {
                  permission: {
                    code: 'users.read',
                    bitfield: '1',
                    isDeprecated: false,
                  },
                },
              ],
            },
          },
        ],
        emails: [{ email: 'test@example.com', isPrimary: true }],
      };

      mockPrismaService.email.findUnique.mockResolvedValue({
        id: '1',
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrimary: true,
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        personId: '1',
        organizationId: '1',
        person: mockPerson,
      } as any);

      mockPrismaService.person.findUnique.mockResolvedValue(mockPerson);
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        personId: '1',
        hashedToken: 'hashed-token',
        deviceDetails: 'test-agent',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(),
        isRevoked: false,
        revokedReason: null,
        lastUsedAt: new Date(),
      });

      mockJwtService.sign.mockReturnValue('mock-access-token');
      mockRbacCacheService.getCachedPersonPermissions.mockResolvedValue(null);

      const result = await service.validateLogin(email, password, mockRequest);

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        tokenType: 'Bearer',
        expiresIn: expect.any(Number),
      });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockPrismaService.email.findUnique.mockResolvedValue(null);

      await expect(
        service.validateLogin('invalid@email.com', 'password', {} as Request),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unverified email', async () => {
      const mockPerson = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        nameEn: 'Test User',
        nameAr: 'مستخدم اختبار',
        passwordHash: 'hash',
        lastLoginAt: new Date(),
        accountStatus: 'active',
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
        isDeleted: false,
      };

      mockPrismaService.email.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrimary: true,
        isVerified: false,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        personId: '1',
        organizationId: '1',
        person: mockPerson,
      } as any);

      await expect(
        service.validateLogin('test@example.com', 'password', {} as Request),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const mockPerson = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        nameEn: 'Test User',
        nameAr: 'مستخدم اختبار',
        passwordHash: await bcrypt.hash('correctpass', 10),
        lastLoginAt: new Date(),
        accountStatus: 'active',
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
        isDeleted: false,
      };

      mockPrismaService.email.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrimary: true,
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        personId: '1',
        organizationId: '1',
        person: mockPerson,
      } as any);

      await expect(
        service.validateLogin('test@example.com', 'wrongpass', {} as Request),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        nameEn: 'Test User',
        nameAr: 'مستخدم اختبار',
      };

      const mockPerson = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        nameEn: registerDto.nameEn,
        nameAr: registerDto.nameAr,
        passwordHash: expect.any(String),
        lastLoginAt: expect.any(Date),
        accountStatus: 'active',
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
        isDeleted: false,
      };

      mockPrismaService.email.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation((callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrismaService);
        }
        return Promise.resolve([]);
      });

      mockPrismaService.person.create.mockResolvedValue(mockPerson);
      mockPrismaService.email.create.mockResolvedValue({
        id: '1',
        email: registerDto.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrimary: true,
        isVerified: false,
        verificationCode: 'ABC123',
        verificationCodeExpiresAt: new Date(),
        personId: '1',
        organizationId: '1',
      });

      const result = await service.register(registerDto);

      expect(result).toEqual({
        message: 'Registration successful. Please verify your email.',
        personId: '1',
      });
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockPrismaService.email.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrimary: true,
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        personId: '1',
        organizationId: '1',
      });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('extractRefreshTokenFromCookie', () => {
    it('should successfully extract refresh token from cookie', () => {
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

    it('should return null when no refresh token cookie exists', () => {
      const mockRequest = {
        cookies: {},
      } as unknown as Request;

      const result = service.extractRefreshTokenFromCookie(mockRequest);

      expect(result).toBeNull();
    });

    it('should return null for invalid refresh token format', () => {
      const mockRequest = {
        cookies: {
          refreshToken: 'invalid-format',
        },
      } as unknown as Request;

      const result = service.extractRefreshTokenFromCookie(mockRequest);

      expect(result).toBeNull();
    });

    it('should handle debug mode logging', () => {
      process.env.DEBUG = 'true';
      const mockRequest = {
        cookies: {
          refreshToken: 'token-id.token-value',
        },
      } as unknown as Request;

      const loggerSpy = jest.spyOn(service['logger'], 'debug');
      service.extractRefreshTokenFromCookie(mockRequest);

      expect(loggerSpy).toHaveBeenCalledWith('Cookies received:', mockRequest.cookies);
    });
  });

  describe('clearAuthCookies', () => {
    it('should clear auth cookies when response object exists', () => {
      const mockClearCookie = jest.fn();
      const mockRequest = {
        res: {
          clearCookie: mockClearCookie,
        },
      } as unknown as Request;

      service.clearAuthCookies(mockRequest);

      expect(mockClearCookie).toHaveBeenCalledWith('accessToken', expect.any(Object));
      expect(mockClearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
    });

    it('should do nothing when response object does not exist', () => {
      const mockRequest = {} as unknown as Request;

      service.clearAuthCookies(mockRequest);
      // No error should be thrown
    });

    it('should use correct cookie options based on environment', () => {
      const originalEnv = process.env.NODE_ENV;
      const mockClearCookie = jest.fn();
      const mockRequest = {
        res: {
          clearCookie: mockClearCookie,
        },
      } as unknown as Request;

      // Test production environment
      process.env.NODE_ENV = 'production';
      service.clearAuthCookies(mockRequest);
      expect(mockClearCookie).toHaveBeenCalledWith('accessToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });

      // Test development environment
      process.env.NODE_ENV = 'development';
      service.clearAuthCookies(mockRequest);
      expect(mockClearCookie).toHaveBeenCalledWith('accessToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
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
      },
    } as unknown as Request;

    beforeEach(() => {
      jest.clearAllMocks();
      process.env.DEBUG = 'false';
    });

    it('should successfully refresh tokens', async () => {
      const mockToken = {
        id: 'token-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        personId: '1',
        hashedToken: await bcrypt.hash('token-value', 10),
        deviceDetails: 'test-agent',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isRevoked: false,
        revokedReason: null,
        lastUsedAt: new Date(),
      };

      const mockUser = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        nameEn: 'Test User',
        nameAr: 'مستخدم اختبار',
        passwordHash: 'hash',
        lastLoginAt: new Date(),
        accountStatus: 'active',
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
        isDeleted: false,
        roles: [
          {
            role: {
              name: 'USER',
              permissions: [
                {
                  permission: {
                    code: 'users.read',
                    bitfield: '1',
                    isDeprecated: false,
                  },
                },
              ],
            },
          },
        ],
        emails: [{ email: 'test@example.com', isPrimary: true }],
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.refreshToken.findFirst.mockResolvedValue(mockToken);
        mockPrismaService.person.findUnique.mockResolvedValue(mockUser);
        mockPrismaService.refreshToken.create.mockResolvedValue({
          id: 'new-token-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          personId: '1',
          hashedToken: 'new-hashed-token',
          deviceDetails: 'test-agent',
          ipAddress: '127.0.0.1',
          expiresAt: new Date(),
          isRevoked: false,
          revokedReason: null,
          lastUsedAt: new Date(),
        });
        return callback(mockPrismaService);
      });

      mockJwtService.sign.mockReturnValue('new-access-token');
      mockRbacCacheService.getCachedPersonPermissions.mockResolvedValue('1');

      const result = await service.refreshToken(mockRequest);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        tokenType: 'Bearer',
        expiresIn: expect.any(Number),
      });
      expect(mockRequest.res.cookie).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException when no refresh token provided', async () => {
      const requestWithoutToken = {
        ...mockRequest,
        cookies: {},
        res: {
          cookie: jest.fn(),
          clearCookie: jest.fn(),
        },
      } as unknown as Request;

      await expect(service.refreshToken(requestWithoutToken))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const mockRequestWithClearCookie = {
        ...mockRequest,
        res: {
          cookie: jest.fn(),
          clearCookie: jest.fn(),
        },
      } as unknown as Request;

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.refreshToken.findFirst.mockResolvedValue({
          id: 'token-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          personId: '1',
          hashedToken: await bcrypt.hash('token-value', 10),
          deviceDetails: 'test-agent',
          ipAddress: '127.0.0.1',
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
          isRevoked: false,
          revokedReason: null,
          lastUsedAt: new Date(),
        });
        return callback(mockPrismaService);
      });

      await expect(service.refreshToken(mockRequestWithClearCookie))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      const mockRequestWithClearCookie = {
        ...mockRequest,
        res: {
          cookie: jest.fn(),
          clearCookie: jest.fn(),
        },
      } as unknown as Request;

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.refreshToken.findFirst.mockResolvedValue({
          id: 'token-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          personId: '1',
          hashedToken: await bcrypt.hash('token-value', 10),
          deviceDetails: 'test-agent',
          ipAddress: '127.0.0.1',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isRevoked: true,
          revokedReason: 'Test revocation',
          lastUsedAt: new Date(),
        });
        return callback(mockPrismaService);
      });

      await expect(service.refreshToken(mockRequestWithClearCookie))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token value', async () => {
      const mockRequestWithClearCookie = {
        ...mockRequest,
        res: {
          cookie: jest.fn(),
          clearCookie: jest.fn(),
        },
      } as unknown as Request;

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.refreshToken.findFirst.mockResolvedValue({
          id: 'token-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          personId: '1',
          hashedToken: await bcrypt.hash('different-token', 10),
          deviceDetails: 'test-agent',
          ipAddress: '127.0.0.1',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isRevoked: false,
          revokedReason: null,
          lastUsedAt: new Date(),
        });
        return callback(mockPrismaService);
      });

      await expect(service.refreshToken(mockRequestWithClearCookie))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should handle debug mode logging', async () => {
      process.env.DEBUG = 'true';

      // Create a new instance of AuthService with debug mode enabled
      const debugService = new AuthService(
        mockPrismaService,
        mockJwtService,
        mockConfigService,
        mockRbacCacheService,
      );

      const loggerSpy = jest.spyOn(debugService['logger'], 'debug');

      const mockRequestWithClearCookie = {
        ...mockRequest,
        cookies: {}, // Remove refresh token to trigger the "no token" debug message
        res: {
          cookie: jest.fn(),
          clearCookie: jest.fn(),
        },
      } as unknown as Request;

      await expect(debugService.refreshToken(mockRequestWithClearCookie))
        .rejects
        .toThrow(UnauthorizedException);

      expect(loggerSpy).toHaveBeenCalledWith('No refresh token found in cookies');
    });
  });

  describe('revokeRefreshToken', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.DEBUG = 'false';
    });

    it('should successfully revoke a token', async () => {
      const tokenString = 'token-id.token-value';
      const mockToken = {
        id: 'token-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        personId: '1',
        hashedToken: await bcrypt.hash('token-value', 10),
        deviceDetails: 'test-agent',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isRevoked: false,
        revokedReason: null,
        lastUsedAt: new Date(),
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockToken);
      mockPrismaService.refreshToken.update.mockResolvedValue({
        ...mockToken,
        isRevoked: true,
        revokedReason: 'Manual logout',
      });

      const result = await service.revokeRefreshToken(tokenString);

      expect(result).toEqual({ message: 'Token revoked successfully' });
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-id' },
        data: {
          isRevoked: true,
          revokedReason: 'Manual logout',
          lastUsedAt: expect.any(Date),
        },
      });
    });

    it('should throw UnauthorizedException for invalid token format', async () => {
      await expect(service.revokeRefreshToken('invalid-format'))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.revokeRefreshToken('token-id.token-value'))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for already revoked token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        personId: '1',
        hashedToken: 'hashed-token',
        deviceDetails: 'test-agent',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(),
        isRevoked: true,
        revokedReason: 'Previously revoked',
        lastUsedAt: new Date(),
      });

      await expect(service.revokeRefreshToken('token-id.token-value'))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token value', async () => {
      const mockToken = {
        id: 'token-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        personId: '1',
        hashedToken: await bcrypt.hash('different-token', 10),
        deviceDetails: 'test-agent',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isRevoked: false,
        revokedReason: null,
        lastUsedAt: new Date(),
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockToken);

      await expect(service.revokeRefreshToken('token-id.token-value'))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should handle debug mode logging', async () => {
      process.env.DEBUG = 'true';
      const debugService = new AuthService(
        mockPrismaService,
        mockJwtService,
        mockConfigService,
        mockRbacCacheService,
      );
      const loggerSpy = jest.spyOn(debugService['logger'], 'debug');

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(debugService.revokeRefreshToken('token-id.token-value'))
        .rejects
        .toThrow(UnauthorizedException);

      expect(loggerSpy).toHaveBeenCalledWith('Token not found or already revoked:', 'token-id');
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all active tokens for a user', async () => {
      const personId = '1';
      const reason = 'Security audit';

      await service.revokeAllUserTokens(personId, reason);

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          personId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedReason: reason,
        },
      });
    });
  });

  describe('revokeTokensByDevice', () => {
    it('should revoke all active tokens for a user on a specific device', async () => {
      const personId = '1';
      const deviceDetails = 'test-device';
      const reason = 'Device logout';

      await service.revokeTokensByDevice(personId, deviceDetails, reason);

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          personId,
          deviceDetails,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedReason: reason,
        },
      });
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should revoke expired tokens and delete old ones', async () => {
      await service.cleanupExpiredTokens();

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedReason: 'Token expired during cleanup',
        },
      });

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully verify email', async () => {
      const mockEmail = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        email: 'test@example.com',
        isPrimary: true,
        isVerified: false,
        verificationCode: 'ABC123',
        verificationCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        personId: '1',
        organizationId: '1',
      };

      mockPrismaService.email.findUnique.mockResolvedValue(mockEmail);
      mockPrismaService.email.update.mockResolvedValue({
        ...mockEmail,
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      });

      const result = await service.verifyEmail('test@example.com', 'ABC123');

      expect(result).toEqual({ message: 'Email verified successfully' });
      expect(mockPrismaService.email.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isVerified: true,
          verificationCode: null,
          verificationCodeExpiresAt: null,
        },
      });
    });

    it('should throw BadRequestException for non-existent email', async () => {
      mockPrismaService.email.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('nonexistent@example.com', 'ABC123'))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid verification code', async () => {
      const mockEmail = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        email: 'test@example.com',
        isPrimary: true,
        isVerified: false,
        verificationCode: 'ABC123',
        verificationCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        personId: '1',
        organizationId: '1',
      };

      mockPrismaService.email.findUnique.mockResolvedValue(mockEmail);

      await expect(service.verifyEmail('test@example.com', 'WRONG123'))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired verification code', async () => {
      const mockEmail = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        email: 'test@example.com',
        isPrimary: true,
        isVerified: false,
        verificationCode: 'ABC123',
        verificationCodeExpiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
        personId: '1',
        organizationId: '1',
      };

      mockPrismaService.email.findUnique.mockResolvedValue(mockEmail);

      await expect(service.verifyEmail('test@example.com', 'ABC123'))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException for null verification code', async () => {
      const mockEmail = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        email: 'test@example.com',
        isPrimary: true,
        isVerified: false,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        personId: '1',
        organizationId: '1',
      };

      mockPrismaService.email.findUnique.mockResolvedValue(mockEmail);

      await expect(service.verifyEmail('test@example.com', 'ABC123'))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaService.email.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.verifyEmail('test@example.com', 'ABC123'))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  // ... rest of existing code ...
}); 