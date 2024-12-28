import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';

const PERMISSION_BITFIELDS_KEY = 'permission:bitfields';
const PERMISSION_CATEGORIES_KEY = 'permission:categories';

@Injectable()
export class PermissionCacheService implements OnModuleInit {
  private readonly logger = new Logger(PermissionCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private eventEmitter: EventEmitter2,
  ) {
    this.eventEmitter.on('permissions.changed', () => {
      this.invalidatePermissionCache();
    });
  }

  async onModuleInit() {
    try {
      this.logger.debug('Initializing permission cache...');
      await this.populateCache();
      this.logger.debug('Permission cache initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize permission cache', error);
      // Don't throw - allow app to start without cache
      return; // Return early to prevent further logging
    }
  }

  private async populateCache() {
    const permissions = await this.discoverPermissions();

    // Store permission bitfields
    for (const p of permissions) {
      await this.cacheManager.set(
        `${PERMISSION_BITFIELDS_KEY}:${p.code}`,
        p.bitfield
      );
    }

    // Store permission categories
    const categorizedPermissions = permissions.reduce((acc, p) => {
      if (!acc[p.category]) {
        acc[p.category] = [];
      }
      acc[p.category].push(...p.permissions);
      return acc;
    }, {} as Record<string, string[]>);

    for (const [category, perms] of Object.entries(categorizedPermissions)) {
      await this.cacheManager.set(
        `${PERMISSION_CATEGORIES_KEY}:${category}`,
        perms.join(',')
      );
    }
  }

  async invalidatePermissionCache() {
    try {
      this.logger.debug('Invalidating permission cache...');

      // Clear existing cache
      const permissions = await this.discoverPermissions();
      
      // Delete old keys
      await Promise.all([
        ...permissions.map(p => 
          this.cacheManager.del(`${PERMISSION_BITFIELDS_KEY}:${p.code}`)
        ),
        ...permissions.map(p => 
          this.cacheManager.del(`${PERMISSION_CATEGORIES_KEY}:${p.category}`)
        )
      ]);

      // Repopulate cache
      await this.populateCache();

      this.logger.debug('Permission cache invalidated and repopulated');
    } catch (error) {
      this.logger.error('Failed to invalidate permission cache', error);
      throw error;
    }
  }

  async getPermissionBitfields(permissions: string[]): Promise<string[]> {
    try {
      const results = await Promise.all(
        permissions.map(p => 
          this.cacheManager.get<string>(`${PERMISSION_BITFIELDS_KEY}:${p}`)
        )
      );
      return results;
    } catch (error) {
      this.logger.error('Failed to get permission bitfields from cache', error);
      throw error;
    }
  }

  private async discoverPermissions() {
    // Mock implementation - replace with actual discovery logic
    return [
      { code: 'users.read', bitfield: '1', category: 'users', permissions: ['read'] },
      { code: 'users.write', bitfield: '2', category: 'users', permissions: ['write'] },
    ];
  }
} 