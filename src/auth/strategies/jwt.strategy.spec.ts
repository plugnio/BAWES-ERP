import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';

// Create a mock Request type that includes only what we need
type MockRequest = Pick<Request, 'headers'> & {
  _jwtValidationResult?: any;
};

// Mock passport-jwt
jest.mock('passport-jwt', () => {
  class Strategy {
    constructor(config: any) {
      Object.assign(this, config);
    }
  }
  return {
    Strategy,
    ExtractJwt: {
      fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(jest.fn()),
    },
  };
});

// Mock PassportStrategy
jest.mock('@nestjs/passport', () => ({
  PassportStrategy: jest.fn().mockImplementation((Strategy) => {
    return Strategy;
  }),
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: PrismaService;
  let configService: ConfigService;

  const mockPrisma = {
    person: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
    get: jest.fn().mockReturnValue('false'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const createMockRequest = (headers: any = {}): MockRequest => ({
      headers: {
        authorization: 'Bearer test.token.here',
        ...headers,
      },
    });

    it('should successfully validate and return user data', async () => {
      const mockPerson = {
        id: '1',
        email: 'test@example.com',
        nameEn: undefined,
        nameAr: undefined,
        permissionBits: '1',
        isSuperAdmin: false,
      };

      mockPrisma.person.findUnique.mockResolvedValueOnce({
        id: '1',
        accountStatus: 'active',
        emails: [{ email: 'test@example.com', isPrimary: true }],
      });

      const result = await strategy.validate(createMockRequest() as Request, { 
        sub: '1',
        email: 'test@example.com',
        permissionBits: '1',
      });

      expect(result).toEqual(mockPerson);
    });

    it('should throw UnauthorizedException when person not found', async () => {
      mockPrisma.person.findUnique.mockResolvedValueOnce(null);

      await expect(strategy.validate(createMockRequest() as Request, { 
        sub: '1',
        email: 'test@example.com',
        permissionBits: '1',
      })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when account is inactive', async () => {
      mockPrisma.person.findUnique.mockResolvedValueOnce({
        id: '1',
        accountStatus: 'inactive',
        emails: [{ email: 'test@example.com', isPrimary: true }],
      });

      await expect(strategy.validate(createMockRequest() as Request, { 
        sub: '1',
        email: 'test@example.com',
        permissionBits: '1',
      })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle missing primary email', async () => {
      const mockPerson = {
        id: '1',
        email: undefined,
        nameEn: undefined,
        nameAr: undefined,
        permissionBits: '1',
        isSuperAdmin: false,
      };

      mockPrisma.person.findUnique.mockResolvedValueOnce({
        id: '1',
        accountStatus: 'active',
        emails: [],
      });

      const result = await strategy.validate(createMockRequest() as Request, { 
        sub: '1',
        email: 'test@example.com',
        permissionBits: '1',
      });
      expect(result).toEqual(mockPerson);
    });

    it('should enable debug mode when configured', async () => {
      const mockPerson = {
        id: '1',
        email: 'test@example.com',
        nameEn: undefined,
        nameAr: undefined,
        permissionBits: '1',
        isSuperAdmin: false,
      };

      mockConfigService.get.mockReturnValueOnce('true');
      mockPrisma.person.findUnique.mockResolvedValueOnce({
        id: '1',
        accountStatus: 'active',
        emails: [{ email: 'test@example.com', isPrimary: true }],
      });

      const result = await strategy.validate(createMockRequest() as Request, { 
        sub: '1',
        email: 'test@example.com',
        permissionBits: '1',
      });
      expect(result).toEqual(mockPerson);
    });

    it('should handle super admin flag in payload', async () => {
      const mockPerson = {
        id: '1',
        email: 'test@example.com',
        nameEn: undefined,
        nameAr: undefined,
        permissionBits: '1',
        isSuperAdmin: true,
      };

      mockPrisma.person.findUnique.mockResolvedValueOnce({
        id: '1',
        accountStatus: 'active',
        emails: [{ email: 'test@example.com', isPrimary: true }],
      });

      const result = await strategy.validate(createMockRequest() as Request, { 
        sub: '1',
        email: 'test@example.com',
        permissionBits: '1',
        isSuperAdmin: true,
      });
      expect(result).toEqual(mockPerson);
    });

    it('should handle name fields when provided', async () => {
      const mockPerson = {
        id: '1',
        email: 'test@example.com',
        nameEn: 'John Doe',
        nameAr: 'جون دو',
        permissionBits: '1',
        isSuperAdmin: false,
      };

      mockPrisma.person.findUnique.mockResolvedValueOnce({
        id: '1',
        accountStatus: 'active',
        emails: [{ email: 'test@example.com', isPrimary: true }],
        nameEn: 'John Doe',
        nameAr: 'جون دو',
      });

      const result = await strategy.validate(createMockRequest() as Request, { 
        sub: '1',
        email: 'test@example.com',
        permissionBits: '1',
      });
      expect(result).toEqual(mockPerson);
    });

    it('should handle debug mode with missing authorization header', async () => {
      mockConfigService.get.mockReturnValueOnce('true');
      const mockRequestNoAuth = createMockRequest();

      const mockPerson = {
        id: '1',
        email: 'test@example.com',
        nameEn: undefined,
        nameAr: undefined,
        permissionBits: '1',
        isSuperAdmin: false,
      };

      mockPrisma.person.findUnique.mockResolvedValueOnce({
        id: '1',
        accountStatus: 'active',
        emails: [{ email: 'test@example.com', isPrimary: true }],
      });

      const result = await strategy.validate(mockRequestNoAuth as Request, { 
        sub: '1',
        email: 'test@example.com',
        permissionBits: '1',
      });
      expect(result).toEqual(mockPerson);
    });

    it('should use cached validation result if available', async () => {
      const cachedUser = {
        id: '1',
        email: 'test@example.com',
        nameEn: 'John Doe',
        nameAr: undefined,
        permissionBits: '1',
        isSuperAdmin: false,
      };

      const mockRequest = createMockRequest();
      mockRequest._jwtValidationResult = cachedUser;

      mockConfigService.get.mockReturnValueOnce('true'); // Enable debug mode

      const result = await strategy.validate(mockRequest as Request, { 
        sub: '1',
        email: 'test@example.com',
        permissionBits: '1',
      });

      expect(result).toEqual(cachedUser);
      expect(mockPrisma.person.findUnique).not.toHaveBeenCalled();
    });

    it('should cache validation result after successful validation', async () => {
      const mockRequest = createMockRequest();

      const mockPerson = {
        id: '1',
        accountStatus: 'active',
        nameEn: 'John Doe',
        nameAr: undefined,
        emails: [{ email: 'test@example.com', isPrimary: true }],
      };

      mockPrisma.person.findUnique.mockResolvedValueOnce(mockPerson);

      const result = await strategy.validate(mockRequest as Request, { 
        sub: '1',
        email: 'test@example.com',
        permissionBits: '1',
      });

      expect(mockRequest['_jwtValidationResult']).toEqual(result);
      expect(mockPrisma.person.findUnique).toHaveBeenCalledTimes(1);
    });
  });
}); 