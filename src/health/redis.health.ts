import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Try to set and get a value
      const testKey = `health:${key}`;
      await this.cacheManager.set(testKey, 'health-check', 10);
      const value = await this.cacheManager.get(testKey);
      
      const isHealthy = value === 'health-check';

      if (isHealthy) {
        return this.getStatus(key, true);
      }

      throw new Error('Redis health check failed');
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false)
      );
    }
  }
} 