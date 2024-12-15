import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD'),
        ttl: configService.get('REDIS_TTL'),
        max: configService.get('REDIS_MAX_MEMORY'),
        isGlobal: true,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {} 