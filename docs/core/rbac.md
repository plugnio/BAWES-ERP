# RBAC (Role-Based Access Control)

## Permission Caching

## Overview
The RBAC system implements permission caching to improve performance and reduce database load. Permissions are cached per user with a configurable TTL (Time To Live).

## Configuration
- `PERMISSION_CACHE_TTL`: Time in seconds that permissions remain cached (default: 300 seconds / 5 minutes)
- Cache key format: `person-permissions:${personId}`

## Cache Invalidation
The cache is automatically invalidated in the following scenarios:
- When a role's permissions are modified
- When a user's roles are modified
- When the TTL expires

## Manual Cache Clearing
If needed, the cache can be cleared manually:
1. For a specific user: `RbacCacheService.clearPersonPermissionCache(personId)`
2. For all users with a specific role: `RbacCacheService.clearPermissionCache(roleId)`

## Potential Issues
1. Multi-node Deployments
   - Ensure cache consistency across nodes using a distributed cache like Redis
   - Configure the same TTL across all nodes

2. Memory Usage
   - Monitor cache size in production
   - Adjust TTL if memory pressure is observed
   - Consider implementing cache size limits

3. Stale Permissions
   - Cache is cleared automatically on role changes
   - TTL ensures eventual consistency
   - Force cache clear if immediate updates are required

## Best Practices
1. Keep TTL reasonably short (5-15 minutes recommended)
2. Clear cache proactively when making permission changes
3. Monitor cache hit rates and memory usage
4. Use distributed cache in production
5. Implement proper error handling for cache failures 