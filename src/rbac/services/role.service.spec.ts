import { Test } from '@nestjs/testing';
import { RoleService } from './role.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacCacheService } from './rbac-cache.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

describe('RoleService', () => {
  let service: RoleService;
  let prisma: PrismaService;
  let cacheService: RbacCacheService;

  const mockPrisma = {
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn().mockImplementation(({ data }) => ({
        id: '1',
        ...data,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      update: jest.fn(),
      delete: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    rolePermission: {
      createMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    personRole: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => {
      if (typeof callback === 'function') {
        return callback(mockPrisma);
      }
      return Promise.all(callback);
    }),
  };

  const mockCacheService = {
    clearPermissionCache: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: RbacCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheService = module.get<RbacCacheService>(RbacCacheService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getRoles', () => {
    it('should return roles without permissions by default', async () => {
      const mockRoles = [
        { id: '1', name: 'Admin' },
        { id: '2', name: 'User' },
      ];
      mockPrisma.role.findMany.mockResolvedValue(mockRoles);

      const result = await service.getRoles();

      expect(result).toEqual(mockRoles);
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        include: {
          permissions: false,
        },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should return roles with permissions when requested', async () => {
      const mockRoles = [
        {
          id: '1',
          name: 'Admin',
          permissions: [
            {
              permission: { id: '1', code: 'users.create' },
            },
          ],
        },
      ];
      mockPrisma.role.findMany.mockResolvedValue(mockRoles);

      const result = await service.getRoles(true);

      expect(result).toEqual(mockRoles);
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        include: {
          permissions: {
            include: { permission: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('getRoleWithPermissions', () => {
    it('should return role with permissions', async () => {
      const mockRole = {
        id: '1',
        name: 'Admin',
        permissions: [
          {
            permission: { id: '1', code: 'users.create' },
          },
        ],
      };
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      const result = await service.getRoleWithPermissions('1');

      expect(result).toEqual(mockRole);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });
    });
  });

  describe('createRole', () => {
    it('should create role without permissions', async () => {
      const dto: CreateRoleDto = {
        name: 'New Role',
        description: 'Test role',
      };

      const mockRole = { id: '1', ...dto, isSystem: false, sortOrder: 0 };
      mockPrisma.role.create.mockResolvedValue(mockRole);
      mockPrisma.role.findFirst.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({
        ...mockRole,
        permissions: [],
      });

      // Mock transaction to return the role with permissions
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      });

      const result = await service.createRole(dto);

      expect(result).toEqual({ ...mockRole, permissions: [] });
      expect(prisma.role.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
          isSystem: false,
          sortOrder: 0,
        },
      });
      expect(prisma.rolePermission.createMany).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when role name already exists', async () => {
      const dto: CreateRoleDto = {
        name: 'Existing Role',
        description: 'Test role',
      };

      // Mock finding existing role with same name
      mockPrisma.role.findFirst.mockResolvedValue({ 
        id: 'existing-id', 
        name: 'Existing Role' 
      });

      await expect(service.createRole(dto)).rejects.toThrow('Role with this name already exists');
    });

    it('should create role with permissions', async () => {
      const dto: CreateRoleDto = {
        name: 'New Role',
        description: 'Test role',
        permissions: ['users.create', 'users.read'],
      };

      const mockRole = { id: '1', ...dto, isSystem: false, sortOrder: 0 };
      const mockPermissions = [
        { id: '1', code: 'users.create' },
        { id: '2', code: 'users.read' },
      ];

      mockPrisma.role.create.mockResolvedValue(mockRole);
      mockPrisma.role.findFirst.mockResolvedValue(null);
      mockPrisma.permission.findMany.mockResolvedValue(mockPermissions);
      mockPrisma.role.findUnique.mockResolvedValue({
        ...mockRole,
        permissions: mockPermissions.map(p => ({ permission: p })),
      });

      // Mock transaction to return the role with permissions
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      });

      const result = await service.createRole(dto);

      expect(result.permissions).toHaveLength(2);
      expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
        data: mockPermissions.map(p => ({
          roleId: mockRole.id,
          permissionId: p.id,
        })),
      });
    });
  });

  describe('updateRolePosition', () => {
    it('should update role positions', async () => {
      const mockRoles = [
        { id: '1', name: 'Role 1', sortOrder: 0 },
        { id: '2', name: 'Role 2', sortOrder: 1 },
        { id: '3', name: 'Role 3', sortOrder: 2 },
      ];

      mockPrisma.role.findMany.mockResolvedValue(mockRoles);
      mockPrisma.role.update.mockImplementation((args) => ({
        ...mockRoles.find(r => r.id === args.where.id),
        sortOrder: args.data.sortOrder,
      }));

      const updatedRoles = mockRoles.map(r => ({
        ...r,
        permissions: [],
      }));
      mockPrisma.role.findMany.mockResolvedValueOnce(mockRoles);
      mockPrisma.role.findMany.mockResolvedValueOnce(updatedRoles);

      await service.updateRolePosition('1', 2);

      expect(prisma.role.update).toHaveBeenCalledTimes(3);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('toggleRolePermission', () => {
    const mockRole = {
      id: '1',
      name: 'Test Role',
      isSystem: false,
    };

    const mockPermission = {
      id: '1',
      code: 'users.create',
    };

    beforeEach(() => {
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.permission.findUnique.mockResolvedValue(mockPermission);
    });

    it('should add permission to role', async () => {
      await service.toggleRolePermission('1', 'users.create', true);

      expect(prisma.rolePermission.create).toHaveBeenCalledWith({
        data: {
          roleId: mockRole.id,
          permissionId: mockPermission.id,
        },
      });
      expect(cacheService.clearPermissionCache).toHaveBeenCalledWith(mockRole.id);
    });

    it('should remove permission from role', async () => {
      await service.toggleRolePermission('1', 'users.create', false);

      expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: {
          roleId: mockRole.id,
          permissionId: mockPermission.id,
        },
      });
      expect(cacheService.clearPermissionCache).toHaveBeenCalledWith(mockRole.id);
    });

    it('should throw NotFoundException for non-existent role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleRolePermission('1', 'users.create', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent permission', async () => {
      mockPrisma.permission.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleRolePermission('1', 'users.create', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for system roles', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({
        ...mockRole,
        isSystem: true,
      });

      await expect(
        service.toggleRolePermission('1', 'users.create', true),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateRole', () => {
    const mockRole = {
      id: '1',
      name: 'Test Role',
      description: 'Test Description',
      isSystem: false,
      sortOrder: 1,
    };

    beforeEach(() => {
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
    });

    it('should update role successfully', async () => {
      const updateDto = {
        name: 'Updated Role',
        description: 'Updated Description',
        sortOrder: 2,
      };

      mockPrisma.role.findFirst.mockResolvedValue(null);
      mockPrisma.role.update.mockResolvedValue({ ...mockRole, ...updateDto });
      mockPrisma.role.findUnique.mockResolvedValueOnce(mockRole);

      const result = await service.updateRole('1', updateDto);

      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
      });
      expect(cacheService.clearPermissionCache).toHaveBeenCalledWith('1');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when role not found', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRole('1', { name: 'Updated Role' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when updating system role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({
        ...mockRole,
        isSystem: true,
      });

      await expect(
        service.updateRole('1', { name: 'Updated Role' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when new name already exists', async () => {
      mockPrisma.role.findFirst.mockResolvedValue({
        id: '2',
        name: 'Updated Role',
      });

      await expect(
        service.updateRole('1', { name: 'Updated Role' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteRole', () => {
    const mockRole = {
      id: '1',
      name: 'Test Role',
      isSystem: false,
    };

    beforeEach(() => {
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
    });

    it('should delete role successfully', async () => {
      mockPrisma.rolePermission.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.personRole.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.role.delete.mockResolvedValue(mockRole);

      const result = await service.deleteRole('1');

      expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: '1' },
      });
      expect(prisma.personRole.deleteMany).toHaveBeenCalledWith({
        where: { roleId: '1' },
      });
      expect(prisma.role.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(cacheService.clearPermissionCache).toHaveBeenCalledWith('1');
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when role not found', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(service.deleteRole('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when deleting system role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue({
        ...mockRole,
        isSystem: true,
      });

      await expect(service.deleteRole('1')).rejects.toThrow(ForbiddenException);
    });
  });
}); 