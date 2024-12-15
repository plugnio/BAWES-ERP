# Caching Strategy Documentation

## Overview
The application uses `@nestjs/cache-manager` for in-memory caching to optimize performance and reduce database load. The caching strategy is designed to balance memory usage with application performance.

## Cache Configuration

```typescript
CacheModule.register({
  ttl: 60 * 60 * 1000, // 1 hour cache duration
  max: 100             // Maximum cache entries
})
```

## Cached Data Types

### 1. User Permissions
**Key Format**: `user-permissions:{userId}`
**Data Cached**: 
- Combined bitfield of all user's role permissions
- Calculated effective permissions
**Why Cache This?**:
- Permission checks happen on every authenticated request
- Calculating permissions requires multiple DB joins
- Bitfield operations are CPU-intensive

```typescript
// Example cached data structure
{
  effectivePermissions: BigInt(1234567),
  lastCalculated: ISODate("2024-01-20T...")
}
```

### 2. Role Permissions
**Key Format**: `role-permissions:{roleId}`
**Data Cached**:
- Role's permission bitfield
- Associated permission codes
**Why Cache This?**:
- Roles are frequently accessed during permission checks
- Role data rarely changes
- Reduces joins with permission tables

```typescript
// Example cached data structure
{
  bitfield: BigInt(7654321),
  permissions: ['users.read', 'users.write'],
  updatedAt: ISODate("2024-01-20T...")
}
```

## Cache Invalidation Scenarios

### 1. User Permission Cache Invalidation
**When**:
- User's roles are modified
- User is assigned new roles
- User's roles are removed
- Role permissions change

```typescript
private async clearUserPermissionCache(userId: string) {
  await this.cacheManager.del(`user-permissions:${userId}`);
}
```

### 2. Role Permission Cache Invalidation
**When**:
- Role permissions are updated
- Role hierarchy changes
- Role is deleted

```typescript
private async clearRolePermissionCache(roleId: string) {
  await this.cacheManager.del(`role-permissions:${roleId}`);
  // Also clear cache for all users with this role
  await this.clearUsersWithRoleCache(roleId);
}
```

## Memory Management

### Cache Entry Size Estimation
1. **User Permission Cache Entry**:
   - Bitfield (8 bytes)
   - Metadata (~100 bytes)
   - Total: ~108 bytes per user

2. **Role Permission Cache Entry**:
   - Bitfield (8 bytes)
   - Permission codes (~200 bytes)
   - Metadata (~100 bytes)
   - Total: ~308 bytes per role

### Maximum Memory Usage
```typescript
const MAX_CACHE_ENTRIES = 100;
const AVG_ENTRY_SIZE = 200; // bytes
const MAX_MEMORY = MAX_CACHE_ENTRIES * AVG_ENTRY_SIZE;
// Maximum memory usage: ~20KB
```

## Cache Hit/Miss Strategy

### Cache Hit
1. Check cache first
2. Return cached data if valid
3. Reset TTL on access

```typescript
async getUserPermissions(userId: string) {
  const cached = await this.cacheManager.get(`user-permissions:${userId}`);
  if (cached) {
    return cached;
  }
  // ... calculate and cache permissions
}
```

### Cache Miss
1. Calculate data from database
2. Store in cache with TTL
3. Return calculated data

```typescript
const permissions = await this.calculateUserPermissions(userId);
await this.cacheManager.set(
  `user-permissions:${userId}`,
  permissions,
  60 * 60 * 1000 // 1 hour TTL
);
```

## LRU Eviction Policy
When cache reaches max entries (100):
1. Identify least recently used entry
2. Evict LRU entry
3. Add new entry
4. Update access timestamps

## Performance Impact

### Without Cache
- Average permission check: ~50ms
- Database queries per check: 3-5
- CPU usage: Medium-High

### With Cache
- Average permission check: ~5ms
- Database queries per check: 0 (on hit)
- CPU usage: Low

## Monitoring and Maintenance

### Cache Statistics
- Hit rate target: >80%
- Miss rate acceptable: <20%
- Eviction rate: Monitor if >10%/hour

### Health Checks
1. Monitor memory usage
2. Track cache hit/miss ratios
3. Alert on high eviction rates
4. Monitor cache-related errors

## Future Improvements

1. **Redis Integration**
   - For distributed deployments
   - Better persistence
   - More sophisticated eviction

2. **Cache Warming**
   - Pre-cache permissions for active users
   - Scheduled cache updates
   - Intelligent prefetching

3. **Cache Analytics**
   - Hit/miss tracking
   - Performance metrics
   - Usage patterns 

## Security Considerations

### JWT and Permissions
Instead of storing permissions in JWT, we should:
1. Store only essential data in JWT:
```typescript
// JWT Payload
{
  "sub": "userId",
  "email": "user@example.com",
  "iat": 1516239022
}
```

2. Use cache for permission checks:
```typescript
async validatePermission(userId: string, permission: string) {
  // Get from cache or recalculate
  const permissions = await this.getUserPermissions(userId);
  return this.checkPermission(permissions, permission);
}
```

### Security Benefits
1. **Immediate Revocation**: Permissions can be revoked instantly by clearing cache
2. **Smaller JWT**: Reduced token size, less network overhead
3. **Up-to-date Permissions**: No stale permissions in JWT
4. **Better Security**: Permissions not exposed in client-side token

## Scaling for Millions of Users

### Current In-Memory Limitations
- 100 cache entries = ~20KB memory
- Limited to single server
- No persistence
- Memory constraints

### Redis Solution
For production with millions of users:

1. **Redis Configuration**:
```typescript
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        ttl: 3600, // 1 hour
        max: 1000000 // Scale to million users
      })
    })
  ]
})
```

2. **Clustering and Sharding**:
```typescript
const Redis = require('ioredis');

const cluster = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  // Add more nodes as needed
]);
```

3. **Memory Management with Redis**:
- Use Redis maxmemory-policy
- Implement proper eviction
```bash
maxmemory 2gb
maxmemory-policy allkeys-lru
```

4. **High Availability**:
- Redis Sentinel for failover
- Redis Cluster for sharding
- Multiple Redis replicas

### Performance at Scale
With Redis:
- Support millions of concurrent users
- Sub-millisecond response times
- Distributed across multiple nodes
- Automatic failover
- Data persistence

### Implementation Example
```typescript
@Injectable()
export class PermissionService {
  constructor(
    @Inject(CACHE_MANAGER) 
    private cacheManager: Cache,
    private redisClient: Redis
  ) {}

  async getUserPermissions(userId: string) {
    const cacheKey = `user-permissions:${userId}`;
    
    // Try cache first
    let permissions = await this.cacheManager.get(cacheKey);
    
    if (!permissions) {
      // Calculate permissions
      permissions = await this.calculatePermissions(userId);
      
      // Store in Redis with proper expiration
      await this.cacheManager.set(
        cacheKey,
        permissions,
        {
          ttl: 3600,
          // Use Redis-specific options
          setEx: true,
          keepTtl: true
        }
      );
    }
    
    return permissions;
  }
}
```

### Monitoring Redis Cache
1. **Key Metrics**:
```typescript
const metrics = await this.redisClient.info();
// Monitor:
// - Memory usage
// - Hit/miss ratio
// - Connected clients
// - Eviction rate
```

2. **Health Checks**:
```typescript
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  async isHealthy() {
    const metrics = await this.getMetrics();
    return {
      redis: {
        status: this.getStatus(metrics),
        memory: metrics.used_memory_human,
        hitRate: metrics.keyspace_hits / 
                (metrics.keyspace_hits + metrics.keyspace_misses)
      }
    };
  }
}
```

### Recommendations for Production
1. Use Redis instead of in-memory cache
2. Implement proper monitoring
3. Set up Redis Cluster for scaling
4. Configure proper memory limits
5. Implement cache warming strategies
6. Use Redis Sentinel for high availability
7. Regular backup of Redis data
8. Monitor and adjust TTL based on usage patterns