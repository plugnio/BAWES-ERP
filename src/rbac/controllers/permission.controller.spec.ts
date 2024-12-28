import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { PermissionCacheService } from '../services/permission-cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Decimal } from 'decimal.js';

describe('PermissionController', () => {
  let controller: PermissionController;
  let permissionService: PermissionService;
  let roleService: RoleService;
  let cacheService: PermissionCacheService;

  beforeEach(async () => {
    const mockPermissionService = {
      getPermissionCategories: jest.fn(),
    };

    const mockRoleService = {
      getRoles: jest.fn(),
    };

    const mockCacheService = {
      getCachedPermissions: jest.fn(),
      setCachedPermissions: jest.fn(),
      clearCache: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
        {
          provide: PermissionCacheService,
          useValue: mockCacheService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
    permissionService = module.get<PermissionService>(PermissionService);
    roleService = module.get<RoleService>(RoleService);
    cacheService = module.get<PermissionCacheService>(PermissionCacheService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPermissionDashboard', () => {
    it('should return dashboard data with categories, roles, and stats', async () => {
      const mockPermission = {
        id: '1',
        name: 'users.read',
        code: 'users.read',
        description: 'Read users',
        category: 'users',
        isDeprecated: false,
        sortOrder: 1,
        bitfield: new Decimal(1),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCategories = [
        {
          name: 'users',
          permissions: [mockPermission],
        },
      ];

      const mockRoles = [
        {
          id: '1',
          name: 'admin',
          description: 'Administrator',
          isSystem: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: [{
            permission: mockPermission,
            roleId: '1',
            permissionId: '1',
            grantedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }],
        },
      ];

      jest.spyOn(permissionService, 'getPermissionCategories').mockResolvedValue(mockCategories);
      jest.spyOn(roleService, 'getRoles').mockResolvedValue(mockRoles);

      const result = await controller.getPermissionDashboard();

      expect(result).toEqual({
        categories: mockCategories,
        roles: mockRoles,
        stats: {
          totalPermissions: 1,
          totalRoles: 1,
          systemRoles: 1,
        },
      });
      expect(permissionService.getPermissionCategories).toHaveBeenCalled();
      expect(roleService.getRoles).toHaveBeenCalledWith(true);
    });

    it('should handle empty categories and roles', async () => {
      const mockCategories = [];
      const mockRoles = [];

      jest.spyOn(permissionService, 'getPermissionCategories').mockResolvedValue(mockCategories);
      jest.spyOn(roleService, 'getRoles').mockResolvedValue(mockRoles);

      const result = await controller.getPermissionDashboard();

      expect(result).toEqual({
        categories: mockCategories,
        roles: mockRoles,
        stats: {
          totalPermissions: 0,
          totalRoles: 0,
          systemRoles: 0,
        },
      });
      expect(permissionService.getPermissionCategories).toHaveBeenCalled();
      expect(roleService.getRoles).toHaveBeenCalledWith(true);
    });

    it('should handle categories with no permissions', async () => {
      const mockCategories = [
        {
          name: 'users',
          permissions: [],
        },
      ];
      const mockRoles = [];

      jest.spyOn(permissionService, 'getPermissionCategories').mockResolvedValue(mockCategories);
      jest.spyOn(roleService, 'getRoles').mockResolvedValue(mockRoles);

      const result = await controller.getPermissionDashboard();

      expect(result).toEqual({
        categories: mockCategories,
        roles: mockRoles,
        stats: {
          totalPermissions: 0,
          totalRoles: 0,
          systemRoles: 0,
        },
      });
      expect(permissionService.getPermissionCategories).toHaveBeenCalled();
      expect(roleService.getRoles).toHaveBeenCalledWith(true);
    });

    it('should handle service errors gracefully', async () => {
      jest.spyOn(permissionService, 'getPermissionCategories').mockRejectedValue(new Error('Service error'));
      jest.spyOn(roleService, 'getRoles').mockRejectedValue(new Error('Service error'));

      await expect(controller.getPermissionDashboard()).rejects.toThrow('Service error');
      expect(permissionService.getPermissionCategories).toHaveBeenCalled();
      expect(roleService.getRoles).toHaveBeenCalledWith(true);
    });
  });
}); 