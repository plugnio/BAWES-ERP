import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import Decimal from 'decimal.js';
import { PermissionService } from '../../rbac/services/permission.service';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let permissionService: PermissionService;
  let logger: jest.SpyInstance;

  // Create a mock request object
  const mockRequest = {
    user: undefined,
  };

  // Create a properly typed mock context
  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
    getHandler: () => ({ name: 'testHandler' }),
    getClass: () => ({ name: 'TestController' }),
  } as ExecutionContext;

  const mockPermissionService = {
    findByCode: jest.fn(),
  };

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
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
    permissionService = module.get<PermissionService>(PermissionService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.DEBUG = undefined;
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no permission is required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should deny access when no user is present', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('test.permission');
    mockRequest.user = undefined;

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should deny access when no permission bits are present', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('test.permission');
    mockRequest.user = { id: '1' };

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should allow access for super admin', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('test.permission');
    mockRequest.user = { 
      id: '1',
      permissionBits: '1',
      isSuperAdmin: true,
    };

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should check permission bits correctly', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('test.permission');
    mockRequest.user = { 
      id: '1',
      permissionBits: '3', // Binary: 11
      isSuperAdmin: false,
    };
    mockPermissionService.findByCode.mockResolvedValue([{
      code: 'test.permission',
      bitfield: '2', // Binary: 10
    }]);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should deny access for insufficient permissions', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('test.permission');
    mockRequest.user = { 
      id: '1',
      permissionBits: '1', // Binary: 01
      isSuperAdmin: false,
    };
    mockPermissionService.findByCode.mockResolvedValue([{
      code: 'test.permission',
      bitfield: '2', // Binary: 10
    }]);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should deny access when permission does not exist', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('test.permission');
    mockRequest.user = { 
      id: '1',
      permissionBits: '1',
      isSuperAdmin: false,
    };
    mockPermissionService.findByCode.mockResolvedValue([]);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  // New tests for 100% coverage
  describe('with debug mode', () => {
    beforeEach(() => {
      // Enable debug mode and recreate the guard to pick up the new setting
      process.env.DEBUG = 'true';
      guard = new PermissionGuard(reflector, permissionService);
    });

    it('should log debug information when no permissions required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      await guard.canActivate(mockContext);

      expect(logger).toHaveBeenCalledWith('Checking permissions for TestController.testHandler');
      expect(logger).toHaveBeenCalledWith('No permissions required for this route');
    });

    it('should log debug information for permission checks', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('test.permission');
      mockRequest.user = { 
        id: '1',
        permissionBits: '3',
        isSuperAdmin: false,
      };
      mockPermissionService.findByCode.mockResolvedValue([{
        code: 'test.permission',
        bitfield: '2',
      }]);

      await guard.canActivate(mockContext);

      expect(logger).toHaveBeenCalledWith('Checking permissions for TestController.testHandler');
      expect(logger).toHaveBeenCalledWith('Required permissions: test.permission');
      expect(logger).toHaveBeenCalledWith('User permission bits: 3');
    });

    it('should log debug information when permission check fails', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('test.permission');
      mockRequest.user = { 
        id: '1',
        permissionBits: '1',
        isSuperAdmin: false,
      };
      mockPermissionService.findByCode.mockResolvedValue([{
        code: 'test.permission',
        bitfield: '2',
      }]);

      await guard.canActivate(mockContext);

      expect(logger).toHaveBeenCalledWith('Checking permissions for TestController.testHandler');
      expect(logger).toHaveBeenCalledWith('Required permissions: test.permission');
      expect(logger).toHaveBeenCalledWith('User permission bits: 1');
      expect(logger).toHaveBeenCalledWith('User does not have permission test.permission');
    });
  });

  describe('with multiple permissions', () => {
    it('should require all permissions to be present', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.read', 'test.write']);
      mockRequest.user = { 
        id: '1',
        permissionBits: '7', // Binary: 111
        isSuperAdmin: false,
      };
      mockPermissionService.findByCode.mockResolvedValue([
        { code: 'test.read', bitfield: '2' },  // Binary: 010
        { code: 'test.write', bitfield: '4' }, // Binary: 100
      ]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should deny access if any required permission is missing', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.read', 'test.write']);
      mockRequest.user = { 
        id: '1',
        permissionBits: '3', // Binary: 011
        isSuperAdmin: false,
      };
      mockPermissionService.findByCode.mockResolvedValue([
        { code: 'test.read', bitfield: '2' },  // Binary: 010
        { code: 'test.write', bitfield: '4' }, // Binary: 100
      ]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle large permission bitfields correctly', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('test.permission');
      mockRequest.user = { 
        id: '1',
        permissionBits: '1152921504606846976', // 2^60
        isSuperAdmin: false,
      };
      mockPermissionService.findByCode.mockResolvedValue([{
        code: 'test.permission',
        bitfield: '1152921504606846976', // 2^60
      }]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should handle multiple high-bit permissions correctly', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['test.high1', 'test.high2']);
      mockRequest.user = { 
        id: '1',
        // Has both 2^59 and 2^60 bits set
        permissionBits: '1729382256910270464', 
        isSuperAdmin: false,
      };
      mockPermissionService.findByCode.mockResolvedValue([
        { code: 'test.high1', bitfield: '576460752303423488' },  // 2^59
        { code: 'test.high2', bitfield: '1152921504606846976' }, // 2^60
      ]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });
}); 