import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { PERMISSIONS_KEY } from '../../auth/decorators/permissions.decorator';
import Decimal from 'decimal.js';
import { PermissionService } from '../services/permission.service';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let permissionService: PermissionService;

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
    getClass: () => ({}),
  } as ExecutionContext;

  const mockPermissionService = {
    findByCode: jest.fn(),
  };

  beforeEach(async () => {
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
}); 