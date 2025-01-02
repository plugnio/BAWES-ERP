import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from '../services/role.service';
import { PersonRoleService } from '../services/person-role.service';
import { BadRequestException } from '@nestjs/common';
import { ToggleRolePermissionDto } from '../dto/toggle-role-permission.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { PermissionCacheService } from '../services/permission-cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { validate } from 'class-validator';

describe('RoleController', () => {
  let controller: RoleController;
  let roleService: RoleService;
  let personRoleService: PersonRoleService;

  const mockRoleService = {
    getRoles: jest.fn(),
    getRoleWithPermissions: jest.fn(),
    createRole: jest.fn(),
    updateRole: jest.fn(),
    deleteRole: jest.fn(),
    updateRolePosition: jest.fn(),
    toggleRolePermission: jest.fn(),
  };

  const mockPersonRoleService = {
    assignRole: jest.fn(),
    removeRole: jest.fn(),
  };

  const mockPermissionCacheService = {
    getCachedPermissions: jest.fn(),
    setCachedPermissions: jest.fn(),
    clearCache: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
        {
          provide: PersonRoleService,
          useValue: mockPersonRoleService,
        },
        {
          provide: PermissionCacheService,
          useValue: mockPermissionCacheService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RoleController>(RoleController);
    roleService = module.get<RoleService>(RoleService);
    personRoleService = module.get<PersonRoleService>(PersonRoleService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('togglePermissions', () => {
    it('should toggle permission successfully', async () => {
      const roleId = 'role-1';
      const dto = new ToggleRolePermissionDto();
      dto.permissionCode = 'users.create';
      dto.enabled = true;
      const expectedResult = { success: true };

      mockRoleService.toggleRolePermission.mockResolvedValue(expectedResult);

      const result = await controller.togglePermissions(roleId, dto);

      expect(result).toEqual(expectedResult);
      expect(roleService.toggleRolePermission).toHaveBeenCalledWith(
        roleId,
        dto.permissionCode,
        dto.enabled,
      );
    });

    it('should validate required fields', async () => {
      const roleId = 'role-1';
      const dto = new ToggleRolePermissionDto();
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
      expect(errors[1].constraints).toHaveProperty('isBoolean');
    });
  });
}); 