import { Test } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacCacheService } from './rbac-cache.service';
import { PermissionDiscoveryService } from './permission-discovery.service';
import { Decimal } from 'decimal.js';

describe('PermissionService', () => {
  let service: PermissionService;
  let prisma: PrismaService;
  let cacheService: RbacCacheService;
  let discoveryService: PermissionDiscoveryService;

  const mockPrisma = {
    permission: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockCacheService = {
    clearPermissionCache: jest.fn(),
  };

  const mockDiscoveryService = {
    getNextBitfield: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: RbacCacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionDiscoveryService,
          useValue: mockDiscoveryService,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheService = module.get<RbacCacheService>(RbacCacheService);
    discoveryService = module.get<PermissionDiscoveryService>(PermissionDiscoveryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPermission', () => {
    it('should create a new permission with correct bitfield', async () => {
      // Arrange
      const permissionData = {
        code: 'users.create',
        name: 'Create Users',
        description: 'Can create users',
        category: 'users',
      };
      const bitfield = new Decimal(2);
      mockDiscoveryService.getNextBitfield.mockResolvedValue(bitfield);
      mockPrisma.permission.create.mockResolvedValue({
        ...permissionData,
        id: 1,
        bitfield: bitfield.toString(),
      });

      // Act
      const result = await service.createPermission(permissionData);

      // Assert
      expect(result).toBeDefined();
      expect(result.bitfield).toBe(bitfield.toString());
      expect(mockCacheService.clearPermissionCache).toHaveBeenCalled();
      expect(mockPrisma.permission.create).toHaveBeenCalledWith({
        data: {
          ...permissionData,
          bitfield: bitfield.toString(),
        },
      });
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions', async () => {
      // Arrange
      const mockPermissions = [
        {
          id: 1,
          code: 'users.create',
          name: 'Create Users',
          description: 'Can create users',
          category: 'users',
          bitfield: '2',
        },
      ];
      mockPrisma.permission.findMany.mockResolvedValue(mockPermissions);

      // Act
      const result = await service.getPermissions();

      // Assert
      expect(result).toEqual(mockPermissions);
      expect(mockPrisma.permission.findMany).toHaveBeenCalled();
    });
  });
}); 