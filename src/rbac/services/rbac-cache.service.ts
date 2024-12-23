import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RbacCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

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

  async getCachedPersonPermissions(personId: string) {
    return this.cacheManager.get(`person-permissions:${personId}`);
  }

  async setCachedPersonPermissions(personId: string, permissions: any) {
    await this.cacheManager.set(`person-permissions:${personId}`, permissions);
  }
} 