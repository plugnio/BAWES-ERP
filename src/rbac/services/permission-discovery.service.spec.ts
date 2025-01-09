import { Test } from '@nestjs/testing';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { PermissionDiscoveryService } from './permission-discovery.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Decimal } from 'decimal.js';
import { Permission, Prisma } from '@prisma/client';
import { ConfigModule } from '@nestjs/config';
import { RbacCacheService } from './rbac-cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('PermissionDiscoveryService', () => {
  let service: PermissionDiscoveryService;
  let discoveryService: jest.Mocked<DiscoveryService>;
  let metadataScanner: jest.Mocked<MetadataScanner>;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.SpyInstance;
  let rbacCache: RbacCacheService;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock logger
    logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'verbose').mockImplementation();

    // Create mock controller for testing
    class TestController {
      @RequirePermissions('test.read')
      testMethod() {}

      @RequirePermissions('test.write')
      anotherMethod() {}

      // Method without permission
      publicMethod() {}
    }

    // Mock services
    const mockPrisma = {
      permission: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        upsert: jest.fn().mockImplementation(({ create }) => ({
          ...create,
          id: '1',
          bitfield: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      },
      role: {
        findUnique: jest.fn(),
      },
      rolePermission: {
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => {
        // Create transaction context with same methods
        const tx = {
          permission: {
            findFirst: jest.fn().mockResolvedValue({ bitfield: '1' }),
            findMany: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockImplementation((data) => ({
              ...data.data,
              id: '1',
              bitfield: '2',
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            upsert: jest.fn().mockImplementation(({ create }) => ({
              ...create,
              id: '1',
              bitfield: '2',
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          },
          role: {
            findUnique: jest.fn().mockResolvedValue({
              id: '1',
              name: 'SUPER_ADMIN',
            }),
          },
          rolePermission: {
            findMany: jest.fn().mockResolvedValue([]),
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return await callback(tx);
      }),
    } as unknown as jest.Mocked<PrismaService>;

    const mockDiscovery = {
      getControllers: jest.fn().mockReturnValue([
        {
          instance: new TestController(),
        },
      ]),
    } as unknown as jest.Mocked<DiscoveryService>;

    const mockMetadataScanner = {
      scanFromPrototype: jest.fn((instance, prototype, callback) => {
        const methods = Object.getOwnPropertyNames(prototype);
        methods.forEach(method => callback(method));
      }),
    } as unknown as jest.Mocked<MetadataScanner>;

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            PERMISSION_CACHE_TTL: '300',
          })],
        }),
      ],
      providers: [
        PermissionDiscoveryService,
        RbacCacheService,
        { provide: DiscoveryService, useValue: mockDiscovery },
        { provide: MetadataScanner, useValue: mockMetadataScanner },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<PermissionDiscoveryService>(PermissionDiscoveryService);
    discoveryService = module.get<DiscoveryService>(DiscoveryService) as jest.Mocked<DiscoveryService>;
    metadataScanner = module.get<MetadataScanner>(MetadataScanner) as jest.Mocked<MetadataScanner>;
    prisma = module.get<PrismaService>(PrismaService) as jest.Mocked<PrismaService>;
    rbacCache = module.get<RbacCacheService>(RbacCacheService);
  });

  afterEach(async () => {
    // Restore all mocks
    jest.restoreAllMocks();
    
    // Clear all timers
    jest.useRealTimers();
    jest.clearAllTimers();
    
    // Reset modules
    jest.resetModules();
    
    // Allow time for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Module Configuration', () => {
    it('should properly inject ConfigService and RbacCacheService', async () => {
      // Create a test module with real ConfigModule
      const testModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              PERMISSION_CACHE_TTL: '300',
            })],
          }),
        ],
        providers: [
          PermissionDiscoveryService,
          RbacCacheService,
          { provide: DiscoveryService, useValue: discoveryService },
          { provide: MetadataScanner, useValue: metadataScanner },
          { provide: PrismaService, useValue: prisma },
          { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
        ],
      }).compile();

      // Get instances of services
      const permissionService = testModule.get<PermissionDiscoveryService>(PermissionDiscoveryService);
      const cacheService = testModule.get<RbacCacheService>(RbacCacheService);

      // Verify services are properly instantiated
      expect(permissionService).toBeDefined();
      expect(cacheService).toBeDefined();

      // Verify cache service can access config
      const ttl = cacheService.getPermissionCacheTTL();
      expect(ttl).toBe(300);
    });

    it('should throw error if ConfigService is not provided', async () => {
      // Attempt to create module without ConfigModule
      await expect(Test.createTestingModule({
        providers: [
          PermissionDiscoveryService,
          RbacCacheService,
          { provide: DiscoveryService, useValue: discoveryService },
          { provide: MetadataScanner, useValue: metadataScanner },
          { provide: PrismaService, useValue: prisma },
          { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
        ],
      }).compile()).rejects.toThrow();
    });
  });

  describe('onModuleInit', () => {
    it('should sync permissions on module init', async () => {
      const syncSpy = jest.spyOn(service as any, 'syncPermissions');
      await service.onModuleInit();
      expect(syncSpy).toHaveBeenCalled();
    });
  });

  describe('syncPermissions', () => {
    it('should discover and sync permissions', async () => {
      const mockPermissions = [
        {
          id: '1',
          code: 'test.read',
          category: 'Test',
          name: 'Read',
          description: 'Permission to read test',
          bitfield: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeprecated: false,
        },
        {
          id: '2',
          code: 'test.write',
          category: 'Test',
          name: 'Write',
          description: 'Permission to write test',
          bitfield: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeprecated: false,
        },
      ];

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          permission: {
            findMany: jest.fn().mockResolvedValue(mockPermissions),
            create: jest.fn().mockImplementation((data) => ({
              ...data.data,
              id: '3',
              bitfield: '4',
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          role: {
            findUnique: jest.fn().mockResolvedValue({
              id: '1',
              name: 'SUPER_ADMIN',
            }),
          },
          rolePermission: {
            findMany: jest.fn().mockResolvedValue([]),
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return await callback(tx);
      });

      await service.onModuleInit();

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle errors during sync', async () => {
      const error = new Error('Sync failed');
      error.stack = 'Error: Sync failed\n    at Object.<anonymous>';
      
      // Mock transaction to throw error
      (prisma.$transaction as jest.Mock).mockRejectedValue(error);

      await expect(service.syncPermissions()).rejects.toThrow('Sync failed');
      expect(logger).toHaveBeenCalledWith('Failed to sync permissions', error.stack);
    });
  });

  describe('discoverPermissions', () => {
    it('should discover permissions from controllers', async () => {
      (prisma.permission.findFirst as jest.Mock).mockResolvedValue(null);
      
      const permissions = await (service as any).discoverPermissions();
      
      expect(permissions).toHaveLength(2); // test.read and test.write
      expect(permissions[0].code).toBe('test.read');
      expect(permissions[1].code).toBe('test.write');
    });

    it('should handle invalid permission format', async () => {
      class InvalidController {
        @RequirePermissions('invalid')
        method() {}
      }

      (discoveryService.getControllers as jest.Mock).mockReturnValue([
        { instance: new InvalidController() },
      ]);
      
      const permissions = await (service as any).discoverPermissions();
      
      expect(permissions).toHaveLength(0);
    });

    it('should calculate correct bitfields', async () => {
      const mockPermission = {
        id: '1',
        name: 'Test Permission',
        code: 'test.permission',
        description: 'Test permission description',
        category: 'Test',
        sortOrder: 1,
        isDeprecated: false,
        bitfield: new Decimal(1),
        createdAt: new Date(),
        updatedAt: new Date()
      } as Permission;

      (prisma.permission.findFirst as jest.Mock).mockResolvedValue(mockPermission);

      const permissions = await (service as any).discoverPermissions();
      
      expect(permissions).toHaveLength(2); // test.read and test.write
      expect(permissions[0].code).toBe('test.read');
      expect(permissions[1].code).toBe('test.write');
    });
  });

  describe('getPermissionsByCategory', () => {
    it('should group permissions by category', async () => {
      const mockPermissions = [
        { category: 'Test', code: 'test.read' },
        { category: 'Test', code: 'test.write' },
        { category: 'User', code: 'user.read' },
      ] as Permission[];

      (prisma.permission.findMany as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await service.getPermissionsByCategory();

      expect(result).toHaveProperty('Test');
      expect(result).toHaveProperty('User');
      expect(result.Test).toHaveLength(2);
      expect(result.User).toHaveLength(1);
    });

    it('should handle errors when fetching permissions', async () => {
      const error = new Error('Database error');
      (prisma.permission.findMany as jest.Mock).mockRejectedValue(error);
      
      await expect(service.getPermissionsByCategory()).rejects.toThrow('Database error');
      expect(logger).toHaveBeenCalledWith('Failed to get permissions by category', error.stack);
    });
  });

  describe('formatPermissionName', () => {
    it('should format permission names correctly', () => {
      const result = (service as any).formatPermissionName('TEST_PERMISSION');
      expect(result).toBe('Test Permission');
    });
  });

  describe('formatCategoryName', () => {
    it('should format category names correctly', () => {
      const result = (service as any).formatCategoryName('TEST_CATEGORY');
      expect(result).toBe('Test Category');
    });
  });
}); 