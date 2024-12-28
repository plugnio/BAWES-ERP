import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';

describe('PermissionController', () => {
  let controller: PermissionController;
  let permissionService: jest.Mocked<PermissionService>;
  let roleService: jest.Mocked<RoleService>;

  beforeEach(async () => {
    const mockPermissionService = {
      getPermissionCategories: jest.fn(),
    };

    const mockRoleService = {
      getRoles: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
    permissionService = module.get(PermissionService);
    roleService = module.get(RoleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPermissionDashboard', () => {
    it('should return dashboard data with categories, roles, and stats', async () => {
      const mockCategories = [
        {
          name: 'users',
          permissions: [
            { name: 'users.create', bitField: '1' },
            { name: 'users.read', bitField: '2' },
          ],
        },
        {
          name: 'roles',
          permissions: [
            { name: 'roles.create', bitField: '4' },
          ],
        },
      ];

      const mockRoles = [
        {
          id: '1',
          name: 'Admin',
          description: 'Administrator role',
          isSystem: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: [],
        },
        {
          id: '2',
          name: 'User',
          description: 'Regular user role',
          isSystem: false,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: [],
        },
      ];

      permissionService.getPermissionCategories.mockResolvedValue(mockCategories);
      roleService.getRoles.mockResolvedValue(mockRoles);

      const result = await controller.getPermissionDashboard();

      expect(result).toEqual({
        categories: mockCategories,
        roles: mockRoles,
        stats: {
          totalPermissions: 3, // Total number of permissions across all categories
          totalRoles: 2,
          systemRoles: 1, // Number of system roles
        },
      });

      expect(permissionService.getPermissionCategories).toHaveBeenCalled();
      expect(roleService.getRoles).toHaveBeenCalledWith(true);
    });

    it('should handle empty categories and roles', async () => {
      const mockCategories = [];
      const mockRoles = [];

      permissionService.getPermissionCategories.mockResolvedValue(mockCategories);
      roleService.getRoles.mockResolvedValue(mockRoles);

      const result = await controller.getPermissionDashboard();

      expect(result).toEqual({
        categories: [],
        roles: [],
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
        {
          name: 'roles',
          permissions: [],
        },
      ];

      const mockRoles = [
        {
          id: '1',
          name: 'Admin',
          description: 'Administrator role',
          isSystem: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: [],
        },
      ];

      permissionService.getPermissionCategories.mockResolvedValue(mockCategories);
      roleService.getRoles.mockResolvedValue(mockRoles);

      const result = await controller.getPermissionDashboard();

      expect(result).toEqual({
        categories: mockCategories,
        roles: mockRoles,
        stats: {
          totalPermissions: 0,
          totalRoles: 1,
          systemRoles: 1,
        },
      });

      expect(permissionService.getPermissionCategories).toHaveBeenCalled();
      expect(roleService.getRoles).toHaveBeenCalledWith(true);
    });

    it('should handle service errors gracefully', async () => {
      permissionService.getPermissionCategories.mockRejectedValue(new Error('Database error'));
      roleService.getRoles.mockRejectedValue(new Error('Database error'));

      await expect(controller.getPermissionDashboard()).rejects.toThrow('Database error');

      expect(permissionService.getPermissionCategories).toHaveBeenCalled();
      expect(roleService.getRoles).toHaveBeenCalledWith(true);
    });
  });
}); 