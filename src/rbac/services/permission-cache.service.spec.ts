import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';
import { PermissionCacheService } from './permission-cache.service';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

describe('PermissionCacheService', () => {
  let service: PermissionCacheService;
  let cacheManager: jest.Mocked<Cache>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let loggerDebug: jest.SpyInstance;
  let loggerError: jest.SpyInstance;

  beforeEach(async () => {
    // Mock logger before creating the service
    loggerDebug = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // Create mock cache manager
    const mockCacheManager = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    // Create mock event emitter
    const mockEventEmitter = {
      on: jest.fn(),
      emit: jest.fn(),
    };

    const mockPrisma = {
      permission: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(fn => fn()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PermissionCacheService>(PermissionCacheService);
    cacheManager = module.get(CACHE_MANAGER);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize cache successfully', async () => {
      // Mock permissions discovery
      jest.spyOn(service as any, 'discoverPermissions').mockResolvedValue([
        { code: 'users.read', bitfield: '1', category: 'users', permissions: ['read'] },
      ]);

      await service.onModuleInit();

      expect(loggerDebug).toHaveBeenCalledWith('Initializing permission cache...');
      expect(cacheManager.set).toHaveBeenCalledWith(
        'permission:bitfields:users.read',
        '1'
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        'permission:categories:users',
        'users.read'
      );
      expect(loggerDebug).toHaveBeenCalledWith('Permission cache initialized successfully');
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock permissions discovery to throw error
      const error = new Error('Discovery failed');
      jest.spyOn(service as any, 'discoverPermissions').mockRejectedValue(error);

      await service.onModuleInit();

      expect(loggerDebug).toHaveBeenCalledWith('Initializing permission cache...');
      expect(loggerError).toHaveBeenCalledWith('Failed to initialize permission cache', error);
    });
  });

  describe('getPermissionBitfields', () => {
    it('should get bitfields for given permission codes', async () => {
      // Mock Redis responses
      cacheManager.get
        .mockResolvedValueOnce('1')  // For users.read
        .mockResolvedValueOnce('2')  // For users.write
        .mockResolvedValueOnce('4'); // For users.delete

      const result = await service.getPermissionBitfields([
        'users.read',
        'users.write',
        'users.delete'
      ]);

      expect(result).toEqual(['1', '2', '4']);
      expect(cacheManager.get).toHaveBeenCalledWith('permission:bitfields:users.read');
      expect(cacheManager.get).toHaveBeenCalledWith('permission:bitfields:users.write');
      expect(cacheManager.get).toHaveBeenCalledWith('permission:bitfields:users.delete');
    });

    it('should retrieve permission bitfields from cache', async () => {
      cacheManager.get
        .mockResolvedValueOnce('1')  // For users.read
        .mockResolvedValueOnce('2'); // For users.write

      const result = await service.getPermissionBitfields(['users.read', 'users.write']);

      expect(result).toEqual(['1', '2']);
      expect(cacheManager.get).toHaveBeenCalledWith('permission:bitfields:users.read');
      expect(cacheManager.get).toHaveBeenCalledWith('permission:bitfields:users.write');
    });

    it('should handle cache retrieval errors', async () => {
      const error = new Error('Cache error');
      cacheManager.get.mockRejectedValue(error);

      await expect(service.getPermissionBitfields(['users.read']))
        .rejects
        .toThrow('Cache error');
      
      expect(loggerError).toHaveBeenCalledWith('Failed to get permission bitfields from cache', error);
    });

    it('should return null for non-existent permissions', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.getPermissionBitfields(['non.existent']);

      expect(result).toEqual([null]);
    });
  });

  describe('invalidatePermissionCache', () => {
    it('should clear and repopulate cache', async () => {
      // Mock permissions discovery
      const mockPermissions = [
        { code: 'users.read', bitfield: '1', category: 'users', permissions: ['read'] },
        { code: 'users.write', bitfield: '2', category: 'users', permissions: ['write'] },
      ];
      jest.spyOn(service as any, 'discoverPermissions').mockResolvedValue(mockPermissions);

      await service.invalidatePermissionCache();

      // Verify old keys are deleted
      expect(cacheManager.del).toHaveBeenCalledWith('permission:bitfields:users.read');
      expect(cacheManager.del).toHaveBeenCalledWith('permission:bitfields:users.write');
      expect(cacheManager.del).toHaveBeenCalledWith('permission:categories:users');

      // Verify new values are set
      expect(cacheManager.set).toHaveBeenCalledWith('permission:bitfields:users.read', '1');
      expect(cacheManager.set).toHaveBeenCalledWith('permission:bitfields:users.write', '2');
      expect(cacheManager.set).toHaveBeenCalledWith('permission:categories:users', 'users.read,users.write');
    });

    it('should handle invalidation errors', async () => {
      jest.spyOn(service as any, 'discoverPermissions').mockRejectedValue(new Error('Discovery failed'));

      await expect(service.invalidatePermissionCache())
        .rejects
        .toThrow('Discovery failed');
    });
  });

  describe('event handling', () => {
    it('should register permissions.changed event handler', () => {
      expect(eventEmitter.on).toHaveBeenCalledWith(
        'permissions.changed',
        expect.any(Function)
      );
    });

    it('should invalidate cache when permissions.changed event is emitted', async () => {
      // Get the event handler function
      const handler = eventEmitter.on.mock.calls[0][1];

      // Mock invalidatePermissionCache
      const invalidateSpy = jest.spyOn(service, 'invalidatePermissionCache').mockResolvedValue();

      // Call the handler
      await handler();

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });
}); 