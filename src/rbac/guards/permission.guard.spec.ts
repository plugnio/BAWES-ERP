import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PermissionGuard } from './permission.guard';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { Cache } from 'cache-manager';
import Decimal from 'decimal.js';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let prisma: PrismaService;
  let cacheManager: Cache;

  // Create a mock request object
  const mockRequest = {
    user: undefined,
  };

  // Create a properly typed mock context
  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
    getHandler: () => ({}),
  } as ExecutionContext;

  const mockPrisma = {
    permission: {
      findUnique: jest.fn(),
    },
    person: {
      findUnique: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
    prisma = module.get<PrismaService>(PrismaService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no permission is required', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when no user ID is present', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('test.permission');
    mockRequest.user = undefined;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should use cached permission when available', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('test.permission');
    mockRequest.user = { id: '1' };
    mockCacheManager.get.mockResolvedValue(true);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(mockCacheManager.get).toHaveBeenCalledWith('permissions:1:test.permission');
    expect(mockPrisma.permission.findUnique).not.toHaveBeenCalled();
  });

  it('should deny access for non-existent permission', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('test.permission');
    mockRequest.user = { id: '1' };
    mockCacheManager.get.mockResolvedValue(undefined);
    mockPrisma.permission.findUnique.mockResolvedValue(null);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should deny access for deprecated permission', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('test.permission');
    mockRequest.user = { id: '1' };
    mockCacheManager.get.mockResolvedValue(undefined);
    mockPrisma.permission.findUnique.mockResolvedValue({
      bitfield: '1',
      isDeprecated: true,
    });

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should throw UnauthorizedException when user not found', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('test.permission');
    mockRequest.user = { id: '1' };
    mockCacheManager.get.mockResolvedValue(undefined);
    mockPrisma.permission.findUnique.mockResolvedValue({
      bitfield: '1',
      isDeprecated: false,
    });
    mockPrisma.person.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should grant access for super admin', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('test.permission');
    mockRequest.user = { id: '1' };
    mockCacheManager.get.mockResolvedValue(undefined);
    mockPrisma.permission.findUnique.mockResolvedValue({
      bitfield: '1',
      isDeprecated: false,
    });
    mockPrisma.person.findUnique.mockResolvedValue({
      id: '1',
      roles: [{ role: { name: 'SUPER_ADMIN' } }],
    });

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(mockCacheManager.set).toHaveBeenCalledWith(
      'permissions:1:test.permission',
      true,
      300,
    );
  });

  it('should check permission bits correctly', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('test.permission');
    mockRequest.user = { 
      id: '1',
      permissionBits: '3', // Binary: 11
    };
    mockCacheManager.get.mockResolvedValue(undefined);
    mockPrisma.permission.findUnique.mockResolvedValue({
      bitfield: '2', // Binary: 10
      isDeprecated: false,
    });
    mockPrisma.person.findUnique.mockResolvedValue({
      id: '1',
      roles: [{ role: { name: 'USER' } }],
    });

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(mockCacheManager.set).toHaveBeenCalledWith(
      'permissions:1:test.permission',
      true,
      300,
    );
  });

  it('should deny access for insufficient permissions', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('test.permission');
    mockRequest.user = { 
      id: '1',
      permissionBits: '1', // Binary: 01
    };
    mockCacheManager.get.mockResolvedValue(undefined);
    mockPrisma.permission.findUnique.mockResolvedValue({
      bitfield: '2', // Binary: 10
      isDeprecated: false,
    });
    mockPrisma.person.findUnique.mockResolvedValue({
      id: '1',
      roles: [{ role: { name: 'USER' } }],
    });

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockCacheManager.set).toHaveBeenCalledWith(
      'permissions:1:test.permission',
      false,
      300,
    );
  });

  it('should handle errors gracefully', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('test.permission');
    mockRequest.user = { id: '1' };
    mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

    await expect(guard.canActivate(mockContext)).rejects.toThrow();
  });
}); 