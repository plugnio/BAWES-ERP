import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { RbacCacheService } from './rbac-cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PersonRole } from '@prisma/client';

describe('RbacCacheService', () => {
  let service: RbacCacheService;
  let cacheManager: jest.Mocked<Cache>;
  let prisma: { personRole: { findMany: jest.Mock } };
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;

    prisma = {
      personRole: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    configService = {
      get: jest.fn().mockReturnValue('300'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<RbacCacheService>(RbacCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should use default TTL when not configured', () => {
      configService.get.mockReturnValue('300');
      const newService = new RbacCacheService(cacheManager, prisma as any, configService);
      expect(newService.getPermissionCacheTTL()).toBe(300);
    });

    it('should use configured TTL when provided', () => {
      configService.get.mockReturnValue('600');
      const newService = new RbacCacheService(cacheManager, prisma as any, configService);
      expect(newService.getPermissionCacheTTL()).toBe(600);
    });
  });

  describe('clearPermissionCache', () => {
    it('should clear cache for all people with the role', async () => {
      const roleId = 'role1';
      const peopleWithRole: Partial<PersonRole>[] = [
        { personId: 'person1', roleId },
        { personId: 'person2', roleId },
      ];

      prisma.personRole.findMany.mockResolvedValue(peopleWithRole);
      cacheManager.del.mockResolvedValue(undefined);

      await service.clearPermissionCache(roleId);

      expect(prisma.personRole.findMany).toHaveBeenCalledWith({
        where: { roleId },
      });
      expect(cacheManager.del).toHaveBeenCalledTimes(2);
      expect(cacheManager.del).toHaveBeenCalledWith('person-permissions:person1');
      expect(cacheManager.del).toHaveBeenCalledWith('person-permissions:person2');
    });

    it('should handle empty result from findMany', async () => {
      prisma.personRole.findMany.mockResolvedValue([]);
      await service.clearPermissionCache('role1');
      expect(cacheManager.del).not.toHaveBeenCalled();
    });
  });

  describe('clearPersonPermissionCache', () => {
    it('should clear cache for a specific person', async () => {
      const personId = 'person1';
      cacheManager.del.mockResolvedValue(undefined);

      await service.clearPersonPermissionCache(personId);

      expect(cacheManager.del).toHaveBeenCalledWith('person-permissions:person1');
    });
  });

  describe('getCachedPersonPermissions', () => {
    it('should return cached permissions when available', async () => {
      const personId = 'person1';
      const permissions = 'permission1,permission2';
      cacheManager.get.mockResolvedValue(permissions);

      const result = await service.getCachedPersonPermissions(personId);

      expect(result).toBe(permissions);
      expect(cacheManager.get).toHaveBeenCalledWith('person-permissions:person1');
    });

    it('should return null when no cached permissions exist', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.getCachedPersonPermissions('person1');

      expect(result).toBeNull();
    });
  });

  describe('setCachedPersonPermissions', () => {
    it('should set permissions in cache with TTL', async () => {
      const personId = 'person1';
      const permissions = 'permission1,permission2';
      cacheManager.set.mockResolvedValue(undefined);

      await service.setCachedPersonPermissions(personId, permissions);

      expect(cacheManager.set).toHaveBeenCalledWith(
        'person-permissions:person1',
        permissions,
        300000 // 300 seconds * 1000 for milliseconds
      );
    });
  });
}); 