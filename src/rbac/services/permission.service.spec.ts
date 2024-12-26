import { Test } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacCacheService } from './rbac-cache.service';
import { Decimal } from 'decimal.js';
import { discoverActualPermissions } from '../../../test/helpers/permission-discovery.helper';

describe('PermissionService', () => {
  let service: PermissionService;
  let prisma: PrismaService;
  let cacheService: RbacCacheService;
  let actualPermissions: any[];

  beforeAll(async () => {
    // Discover actual permissions from code
    actualPermissions = await discoverActualPermissions();
    
    // Validate we have permissions to test with
    expect(actualPermissions.length).toBeGreaterThan(0);
    console.log(`Discovered ${actualPermissions.length} permissions for testing`);
  });

  const mockPrisma = {
    permission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    role: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockCacheService = {
    clearPermissionCache: jest.fn(),
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
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheService = module.get<RbacCacheService>(RbacCacheService);

    // Reset mocks but keep using actual permissions
    jest.clearAllMocks();
    mockPrisma.permission.findMany.mockResolvedValue(actualPermissions);
  });

  describe('getPermissionCategories', () => {
    it('should group actual permissions by category', async () => {
      // Act
      const result = await service.getPermissionCategories();

      // Assert
      // Get unique categories from actual permissions
      const uniqueCategories = [...new Set(actualPermissions.map(p => p.category))];
      
      expect(result.length).toBe(uniqueCategories.length);
      
      // Verify each category
      uniqueCategories.forEach(category => {
        const categoryGroup = result.find(r => r.name === category);
        expect(categoryGroup).toBeDefined();
        
        const expectedPermissions = actualPermissions.filter(p => p.category === category);
        expect(categoryGroup.permissions).toHaveLength(expectedPermissions.length);
      });

      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
      });
    });

    it('should maintain consistent category structure', async () => {
      // Act
      const result = await service.getPermissionCategories();

      // Assert
      result.forEach(category => {
        // Category names should be PascalCase
        expect(category.name).toMatch(/^[A-Z][a-zA-Z]*$/);
        expect(Array.isArray(category.permissions)).toBe(true);
        
        category.permissions.forEach(permission => {
          expect(permission.category).toBe(category.name);
          // Permission codes should be lowercase.category.action
          expect(permission.code).toMatch(new RegExp(`^${category.name.toLowerCase()}\\.`));
        });
      });
    });

    it('should handle empty permissions list', async () => {
      mockPrisma.permission.findMany.mockResolvedValue([]);

      const result = await service.getPermissionCategories();

      expect(result).toHaveLength(0);
    });
  });

  describe('createPermission', () => {
    it('should create permission with correct bitfield sequence', async () => {
      // Use the last actual permission to test bitfield sequence
      const lastPermission = actualPermissions[actualPermissions.length - 1];
      mockPrisma.permission.findFirst.mockResolvedValue(lastPermission);

      // Create a new permission in the same category
      const permissionData = {
        code: `${lastPermission.category}.new_action`,
        name: 'New Action',
        category: lastPermission.category,
        description: 'Test permission',
      };

      // Act
      await service.createPermission(permissionData);

      // Assert
      // Verify the new bitfield is double the last one
      const expectedBitfield = (BigInt(lastPermission.bitfield) * 2n).toString();
      expect(prisma.permission.create).toHaveBeenCalledWith({
        data: {
          ...permissionData,
          bitfield: expectedBitfield,
        },
      });
    });

    it('should handle edge cases from actual permissions', async () => {
      // Test with various categories from actual permissions
      for (const category of new Set(actualPermissions.map(p => p.category))) {
        const categoryPermissions = actualPermissions.filter(p => p.category === category);
        
        // Verify bitfield sequence within each category
        const bitfields = categoryPermissions.map(p => BigInt(p.bitfield));
        
        // Check if bitfields are powers of 2
        bitfields.forEach(bitfield => {
          expect(bitfield & (bitfield - BigInt(1))).toBe(BigInt(0));
        });
        
        // Check if bitfields are unique
        expect(new Set(bitfields).size).toBe(bitfields.length);
      }
    });

    it('should handle first permission in new category', async () => {
      mockPrisma.permission.findFirst.mockResolvedValue(null);

      const permissionData = {
        code: 'newcategory.create',
        name: 'Create',
        category: 'NewCategory',
        description: 'First permission in new category',
      };

      await service.createPermission(permissionData);

      expect(prisma.permission.create).toHaveBeenCalledWith({
        data: {
          ...permissionData,
          bitfield: '1',
        },
      });
    });
  });

  describe('getPermissionDashboard', () => {
    it('should return dashboard with actual permission stats', async () => {
      // Act
      const result = await service.getPermissionDashboard();

      // Assert
      const uniqueCategories = [...new Set(actualPermissions.map(p => p.category))];
      
      expect(result.categories).toHaveLength(uniqueCategories.length);
      expect(result.stats.totalPermissions).toBe(actualPermissions.length);
      
      // Verify category totals match
      const categoryTotals = result.categories.reduce((sum, cat) => sum + cat.permissions.length, 0);
      expect(categoryTotals).toBe(actualPermissions.length);
    });

    it('should handle empty permissions list', async () => {
      mockPrisma.permission.findMany.mockResolvedValue([]);

      const result = await service.getPermissionDashboard();

      expect(result.categories).toHaveLength(0);
      expect(result.stats.totalPermissions).toBe(0);
    });
  });
}); 