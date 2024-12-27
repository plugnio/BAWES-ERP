import { Test } from '@nestjs/testing';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { PermissionDiscoveryService } from './permission-discovery.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { Decimal } from 'decimal.js';
import { Permission, Prisma } from '@prisma/client';

describe('PermissionDiscoveryService', () => {
  let service: PermissionDiscoveryService;
  let discoveryService: jest.Mocked<DiscoveryService>;
  let metadataScanner: jest.Mocked<MetadataScanner>;
  let prisma: jest.Mocked<PrismaService>;
  let logger: jest.SpyInstance;

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
      @RequirePermission('test.read')
      testMethod() {}

      @RequirePermission('test.write')
      anotherMethod() {}

      // Method without permission
      publicMethod() {}
    }

    // Mock services
    const mockPrisma = {
      permission: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => {
        // Create transaction context with same methods
        const tx = {
          permission: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            createMany: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
          },
          role: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          }
        };
        return callback(tx);
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

    const module = await Test.createTestingModule({
      providers: [
        PermissionDiscoveryService,
        { provide: DiscoveryService, useValue: mockDiscovery },
        { provide: MetadataScanner, useValue: mockMetadataScanner },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PermissionDiscoveryService>(PermissionDiscoveryService);
    discoveryService = module.get<DiscoveryService>(DiscoveryService) as jest.Mocked<DiscoveryService>;
    metadataScanner = module.get<MetadataScanner>(MetadataScanner) as jest.Mocked<MetadataScanner>;
    prisma = module.get<PrismaService>(PrismaService) as jest.Mocked<PrismaService>;
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
      // Mock existing permissions
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

      // Mock transaction context
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          permission: {
            findMany: jest.fn().mockResolvedValue([mockPermission]),
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          role: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          }
        };
        return callback(tx);
      });

      await (service as any).syncPermissions();

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle errors during sync', async () => {
      const error = new Error('Sync failed');
      
      // Mock transaction to throw error
      (prisma.$transaction as jest.Mock).mockRejectedValue(error);
      
      await expect((service as any).syncPermissions()).rejects.toThrow('Sync failed');
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
        @RequirePermission('invalid')
        method() {}
      }

      (discoveryService.getControllers as jest.Mock).mockReturnValue([
        { instance: new InvalidController() },
      ]);
      
      await (service as any).discoverPermissions();
      
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      expect(warnSpy).toHaveBeenCalledWith(
        'Invalid permission format: invalid in InvalidController.method'
      );
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
      
      expect(permissions[0].bitfield).toEqual(new Decimal(2));
      expect(permissions[1].bitfield).toEqual(new Decimal(4));
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