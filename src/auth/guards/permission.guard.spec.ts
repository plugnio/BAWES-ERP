import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { PermissionCacheService } from '../../rbac/services/permission-cache.service';
import Decimal from 'decimal.js';
import { PERMISSIONS_KEY } from '../../rbac/decorators/require-permission.decorator';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let permissionCache: PermissionCacheService;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let logger: jest.SpyInstance;

  beforeEach(async () => {
    // Store original environment
    process.env.DEBUG = undefined;

    // Mock logger before creating the guard
    logger = jest.spyOn(Logger.prototype, 'debug').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: PermissionCacheService,
          useValue: {
            getPermissionBitfields: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
    permissionCache = module.get<PermissionCacheService>(PermissionCacheService);

    mockRequest = {
      user: null,
    };

    mockContext = {
      getHandler: jest.fn().mockReturnValue({ name: 'testHandler' }),
      getClass: jest.fn().mockReturnValue({ name: 'TestController' }),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    process.env.DEBUG = undefined;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no permissions required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should deny access when no user in request', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
    mockRequest.user = null;

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should allow access for super admin', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
    mockRequest.user = {
      id: '1',
      permissionBits: '1',
      isSuperAdmin: true,
    };

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should check permission bits correctly', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
    mockRequest.user = {
      id: '1',
      permissionBits: '3', // Binary: 11
      isSuperAdmin: false,
    };

    jest.spyOn(permissionCache, 'getPermissionBitfields')
      .mockResolvedValue(['2']); // Binary: 10

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(permissionCache.getPermissionBitfields).toHaveBeenCalledWith(['test.permission']);
  });

  it('should deny access for insufficient permissions', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
    mockRequest.user = {
      id: '1',
      permissionBits: '1', // Binary: 01
      isSuperAdmin: false,
    };

    jest.spyOn(permissionCache, 'getPermissionBitfields')
      .mockResolvedValue(['2']); // Binary: 10

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should deny access when permission does not exist in cache', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
    mockRequest.user = {
      id: '1',
      permissionBits: '1',
      isSuperAdmin: false,
    };

    jest.spyOn(permissionCache, 'getPermissionBitfields')
      .mockResolvedValue([null]);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should handle single permission string correctly', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('test.permission');
    mockRequest.user = {
      id: '1',
      permissionBits: '2',
      isSuperAdmin: false,
    };

    jest.spyOn(permissionCache, 'getPermissionBitfields')
      .mockResolvedValue(['2']);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should check multiple permissions correctly', async () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['test.read', 'test.write']);
    
    mockRequest.user = {
      id: '1',
      permissionBits: '3', // Binary: 11
      isSuperAdmin: false,
    };

    jest.spyOn(permissionCache, 'getPermissionBitfields')
      .mockResolvedValue(['1', '2']); // Binary: 01, 10

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should deny access when missing one of multiple permissions', async () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['test.read', 'test.write']);
    
    mockRequest.user = {
      id: '1',
      permissionBits: '1', // Binary: 01
      isSuperAdmin: false,
    };

    jest.spyOn(permissionCache, 'getPermissionBitfields')
      .mockResolvedValue(['1', '2']); // Binary: 01, 10

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should deny access when permission bits are missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
    mockRequest.user = {
      id: '1',
      isSuperAdmin: false,
    };

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  describe('with debug mode', () => {
    beforeEach(() => {
      process.env.DEBUG = 'true';
      guard = new PermissionGuard(reflector, permissionCache);
    });

    it('should log debug information when no permissions required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      await guard.canActivate(mockContext);

      expect(logger).toHaveBeenCalledWith('Checking permissions for TestController.testHandler');
      expect(logger).toHaveBeenCalledWith('No permissions required for this route');
    });

    it('should log debug information for permission checks', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
      mockRequest.user = {
        id: '1',
        permissionBits: '3',
        isSuperAdmin: false,
      };
      jest.spyOn(permissionCache, 'getPermissionBitfields')
        .mockResolvedValue(['2']);

      await guard.canActivate(mockContext);

      expect(logger).toHaveBeenCalledWith('Checking permissions for TestController.testHandler');
      expect(logger).toHaveBeenCalledWith('Required permissions: test.permission');
      expect(logger).toHaveBeenCalledWith('User permission bits: 3');
    });

    it('should log debug information when permission check fails', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
      mockRequest.user = {
        id: '1',
        permissionBits: '1',
        isSuperAdmin: false,
      };
      jest.spyOn(permissionCache, 'getPermissionBitfields')
        .mockResolvedValue(['2']);

      await guard.canActivate(mockContext);

      expect(logger).toHaveBeenCalledWith('Checking permissions for TestController.testHandler');
      expect(logger).toHaveBeenCalledWith('Required permissions: test.permission');
      expect(logger).toHaveBeenCalledWith('User permission bits: 1');
      expect(logger).toHaveBeenCalledWith('User does not have permission test.permission');
    });

    it('should log debug information for super admin access', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
      mockRequest.user = {
        id: '1',
        permissionBits: '1',
        isSuperAdmin: true,
      };

      await guard.canActivate(mockContext);

      expect(logger).toHaveBeenCalledWith('User is SUPER_ADMIN, granting access');
    });

    it('should log debug information when no user found', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
      mockRequest.user = null;

      await guard.canActivate(mockContext);

      expect(logger).toHaveBeenCalledWith('No user found in request');
    });

    it('should log debug information when permission bits missing', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
      mockRequest.user = {
        id: '1',
        isSuperAdmin: false,
      };

      await guard.canActivate(mockContext);

      expect(logger).toHaveBeenCalledWith('No permission bits found in request');
      expect(logger).toHaveBeenCalledWith('Request user:', mockRequest.user);
    });

    it('should log debug information for bitwise operations', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
      mockRequest.user = {
        id: '1',
        permissionBits: '3',
        isSuperAdmin: false,
      };
      jest.spyOn(permissionCache, 'getPermissionBitfields')
        .mockResolvedValue(['2']);

      await guard.canActivate(mockContext);

      expect(logger).toHaveBeenCalledWith('Checking permission test.permission with bitfield 2');
      expect(logger).toHaveBeenCalledWith('Permission check for test.permission:');
      expect(logger).toHaveBeenCalledWith('  userBits: 3');
      expect(logger).toHaveBeenCalledWith('  permissionBitfield: 2');
      expect(logger).toHaveBeenCalledWith('  hasPermission: true');
    });
  });

  describe('edge cases', () => {
    it('should handle large permission bitfields correctly', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
      mockRequest.user = {
        id: '1',
        permissionBits: '1152921504606846976', // 2^60
        isSuperAdmin: false,
      };

      jest.spyOn(permissionCache, 'getPermissionBitfields')
        .mockResolvedValue(['1152921504606846976']); // 2^60

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle multiple high-bit permissions correctly', async () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['test.high1', 'test.high2']);
      
      mockRequest.user = {
        id: '1',
        // Has both 2^59 and 2^60 bits set
        permissionBits: '1729382256910270464',
        isSuperAdmin: false,
      };

      jest.spyOn(permissionCache, 'getPermissionBitfields')
        .mockResolvedValue([
          '576460752303423488',  // 2^59
          '1152921504606846976', // 2^60
        ]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle permission check with zero bits', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.permission']);
      mockRequest.user = {
        id: '1',
        permissionBits: '0',
        isSuperAdmin: false,
      };

      jest.spyOn(permissionCache, 'getPermissionBitfields')
        .mockResolvedValue(['1']);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });
}); 