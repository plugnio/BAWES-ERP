import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    super();
  }

  async checkHealth(key: string): Promise<HealthIndicatorResult> {
    try {
      const testKey = `health:${key}`;
      await this.cacheManager.set(testKey, 'health-check', 10);
      const value = await this.cacheManager.get(testKey);
      await this.cacheManager.del(testKey);

      const isHealthy = value === 'health-check';

      return this.getStatus(key, isHealthy);
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }
} 