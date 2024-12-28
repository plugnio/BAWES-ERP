import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RbacCacheService {
  private readonly PERMISSION_CACHE_TTL: number;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Default to 5 minutes if not configured
    const configTTL = this.configService.get<string>('PERMISSION_CACHE_TTL', '300');
    this.PERMISSION_CACHE_TTL = parseInt(configTTL, 10);
  }

  async clearPermissionCache(roleId: string) {
    const peopleWithRole = await this.prisma.personRole.findMany({
      where: { roleId },
    });

    await Promise.all(
      peopleWithRole.map((pr) => this.clearPersonPermissionCache(pr.personId)),
    );
  }

  async clearPersonPermissionCache(personId: string) {
    await this.cacheManager.del(`person-permissions:${personId}`);
  }

  async getCachedPersonPermissions(personId: string): Promise<string | null> {
    return this.cacheManager.get<string>(`person-permissions:${personId}`);
  }

  async setCachedPersonPermissions(personId: string, permissions: string) {
    await this.cacheManager.set(
      `person-permissions:${personId}`,
      permissions,
      this.PERMISSION_CACHE_TTL * 1000 // Convert to milliseconds
    );
  }

  // Get the configured TTL value in seconds
  getPermissionCacheTTL(): number {
    return this.PERMISSION_CACHE_TTL;
  }
} 