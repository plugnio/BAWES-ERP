import { Test } from '@nestjs/testing';
import { PersonRoleService } from './person-role.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacCacheService } from './rbac-cache.service';
import { NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';

describe('PersonRoleService', () => {
  let service: PersonRoleService;
  let prisma: PrismaService;
  let cacheService: RbacCacheService;

  const mockPrisma = {
    role: {
      findUnique: jest.fn(),
    },
    person: {
      findUnique: jest.fn(),
    },
    personRole: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    permission: {
      findUnique: jest.fn(),
    },
  };

  const mockCacheService = {
    clearPersonPermissionCache: jest.fn(),
    getCachedPersonPermissions: jest.fn(),
    setCachedPersonPermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PersonRoleService,
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

    service = module.get<PersonRoleService>(PersonRoleService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheService = module.get<RbacCacheService>(RbacCacheService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('assignRole', () => {
    const mockRole = {
      id: '1',
      name: 'Test Role',
    };

    const mockPerson = {
      id: '1',
      nameEn: 'Test User',
      roles: [],
    };

    it('should assign role to person', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.personRole.create.mockResolvedValue({
        personId: mockPerson.id,
        roleId: mockRole.id,
      });
      mockPrisma.person.findUnique.mockResolvedValue(mockPerson);

      await service.assignRole(mockPerson.id, mockRole.id);

      expect(prisma.personRole.create).toHaveBeenCalledWith({
        data: {
          personId: mockPerson.id,
          roleId: mockRole.id,
        },
      });
      expect(cacheService.clearPersonPermissionCache).toHaveBeenCalledWith(mockPerson.id);
    });

    it('should throw NotFoundException for non-existent role', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(service.assignRole('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeRole', () => {
    it('should remove role from person', async () => {
      const mockPerson = {
        id: '1',
        nameEn: 'Test User',
        roles: [],
      };

      mockPrisma.personRole.delete.mockResolvedValue({});
      mockPrisma.person.findUnique.mockResolvedValue(mockPerson);

      await service.removeRole('1', '1');

      expect(prisma.personRole.delete).toHaveBeenCalledWith({
        where: {
          personId_roleId: {
            personId: '1',
            roleId: '1',
          },
        },
      });
      expect(cacheService.clearPersonPermissionCache).toHaveBeenCalledWith('1');
    });
  });

  describe('getPersonRoles', () => {
    it('should return person with roles and permissions', async () => {
      const mockPerson = {
        id: '1',
        nameEn: 'Test User',
        roles: [
          {
            role: {
              id: '1',
              name: 'Test Role',
              permissions: [
                {
                  permission: {
                    id: '1',
                    code: 'test.permission',
                    bitfield: '1',
                  },
                },
              ],
            },
          },
        ],
      };

      mockPrisma.person.findUnique.mockResolvedValue(mockPerson);

      const result = await service.getPersonRoles('1');

      expect(result).toEqual(mockPerson);
      expect(prisma.person.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });
  });

  describe('getRoleMembers', () => {
    it('should return all members of a role', async () => {
      const mockMembers = [
        {
          person: {
            id: '1',
            nameEn: 'Test User 1',
          },
        },
        {
          person: {
            id: '2',
            nameEn: 'Test User 2',
          },
        },
      ];

      mockPrisma.personRole.findMany.mockResolvedValue(mockMembers);

      const result = await service.getRoleMembers('1');

      expect(result).toEqual(mockMembers);
      expect(prisma.personRole.findMany).toHaveBeenCalledWith({
        where: { roleId: '1' },
        include: {
          person: true,
        },
      });
    });
  });

  describe('calculateEffectivePermissions', () => {
    it('should return cached permissions if available', async () => {
      const cachedValue = '3';
      mockCacheService.getCachedPersonPermissions.mockResolvedValue(cachedValue);

      const result = await service.calculateEffectivePermissions('1');

      expect(result).toEqual(new Decimal(cachedValue));
      expect(prisma.person.findUnique).not.toHaveBeenCalled();
    });

    it('should calculate and cache permissions if not cached', async () => {
      mockCacheService.getCachedPersonPermissions.mockResolvedValue(null);
      
      const mockPerson = {
        id: '1',
        nameEn: 'Test User',
        roles: [
          {
            role: {
              permissions: [
                { permission: { bitfield: '1' } },
                { permission: { bitfield: '2' } },
              ],
            },
          },
        ],
      };

      mockPrisma.person.findUnique.mockResolvedValue(mockPerson);

      const result = await service.calculateEffectivePermissions('1');

      expect(result).toEqual(new Decimal('3')); // 1 + 2 = 3
      expect(cacheService.setCachedPersonPermissions).toHaveBeenCalledWith('1', '3');
    });

    it('should return 0 for non-existent person', async () => {
      mockCacheService.getCachedPersonPermissions.mockResolvedValue(null);
      mockPrisma.person.findUnique.mockResolvedValue(null);

      const result = await service.calculateEffectivePermissions('1');

      expect(result).toEqual(new Decimal(0));
    });
  });

  describe('hasPermission', () => {
    it('should return true if person has permission', async () => {
      // Mock person having permission bitfield 3 (binary 11)
      mockCacheService.getCachedPersonPermissions.mockResolvedValue('3');
      
      // Mock permission with bitfield 1 (binary 1)
      mockPrisma.permission.findUnique.mockResolvedValue({
        id: '1',
        code: 'test.permission',
        bitfield: '1',
      });

      const result = await service.hasPermission('1', 'test.permission');

      expect(result).toBe(true);
    });

    it('should return false if person does not have permission', async () => {
      // Mock person having permission bitfield 2 (binary 10)
      mockCacheService.getCachedPersonPermissions.mockResolvedValue('2');
      
      // Mock permission with bitfield 1 (binary 1)
      mockPrisma.permission.findUnique.mockResolvedValue({
        id: '1',
        code: 'test.permission',
        bitfield: '1',
      });

      const result = await service.hasPermission('1', 'test.permission');

      expect(result).toBe(false);
    });

    it('should return false for non-existent permission', async () => {
      mockCacheService.getCachedPersonPermissions.mockResolvedValue('1');
      mockPrisma.permission.findUnique.mockResolvedValue(null);

      const result = await service.hasPermission('1', 'non.existent');

      expect(result).toBe(false);
    });
  });
}); 