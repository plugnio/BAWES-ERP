# Performance Testing Guide

This guide covers performance testing strategies and implementation.

## Overview

Performance tests ensure:
- API response times
- System scalability
- Resource utilization
- Cache effectiveness
- Database performance

## Test Types

### Load Testing
- Simulate normal load
- Measure response times
- Check resource usage
- Verify caching
- Monitor errors

### Stress Testing
- Test system limits
- Find breaking points
- Measure recovery
- Check error handling
- Monitor resources

### Endurance Testing
- Long-running tests
- Memory leaks
- Resource leaks
- Performance degradation
- System stability

### Spike Testing
- Sudden load increases
- Recovery time
- Error handling
- Resource scaling
- System stability

## Test Implementation

### Basic Load Test

```typescript
// test/performance/load.spec.ts
import * as autocannon from 'autocannon';

describe('Load Testing', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    
    url = await app.getUrl();
  });

  it('should handle normal load', async () => {
    const result = await autocannon({
      url: `${url}/users`,
      connections: 10,
      duration: 10,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });

    // Verify performance metrics
    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.latency.p99).toBeLessThan(100); // 99th percentile < 100ms
    expect(result.requests.average).toBeGreaterThan(1000); // > 1000 RPS
  });
});
```

### Database Performance

```typescript
// test/performance/database.spec.ts
describe('Database Performance', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    // Create test data
    await prisma.user.createMany({
      data: Array(1000).fill(0).map((_, i) => ({
        email: `user${i}@test.com`,
      })),
    });
  });

  it('should efficiently query large datasets', async () => {
    const start = Date.now();
    
    // Test pagination
    const results = await prisma.user.findMany({
      take: 10,
      skip: 500,
      orderBy: { id: 'desc' },
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // < 100ms
    expect(results).toHaveLength(10);
  });

  it('should handle complex joins efficiently', async () => {
    const start = Date.now();
    
    // Test complex query
    const results = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
      where: {
        roles: {
          some: {
            permissions: {
              some: {
                code: 'users.manage',
              },
            },
          },
        },
      },
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(200); // < 200ms
  });
});
```

### Cache Performance

```typescript
// test/performance/cache.spec.ts
describe('Cache Performance', () => {
  let redis: RedisService;

  it('should improve read performance', async () => {
    // Without cache
    const uncachedStart = Date.now();
    const uncachedResult = await service.getExpensiveData();
    const uncachedDuration = Date.now() - uncachedStart;

    // With cache
    const cachedStart = Date.now();
    const cachedResult = await service.getExpensiveData();
    const cachedDuration = Date.now() - cachedStart;

    // Cache should be significantly faster
    expect(cachedDuration).toBeLessThan(uncachedDuration / 10);
  });

  it('should handle cache stampede', async () => {
    // Simulate multiple concurrent requests
    const requests = Array(100).fill(0).map(() => 
      service.getCachedData()
    );

    const start = Date.now();
    await Promise.all(requests);
    const duration = Date.now() - start;

    // Should use cache lock to prevent stampede
    expect(duration).toBeLessThan(1000); // < 1s for all requests
  });
});
```

### Memory Usage

```typescript
// test/performance/memory.spec.ts
describe('Memory Usage', () => {
  it('should not leak memory', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Perform memory-intensive operations
    for (let i = 0; i < 1000; i++) {
      await service.processLargeData();
    }

    // Force garbage collection
    global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const diff = finalMemory - initialMemory;
    
    // Memory increase should be minimal
    expect(diff).toBeLessThan(1024 * 1024); // < 1MB
  });
});
```

## Performance Monitoring

### Metrics Collection

```typescript
// src/monitoring/metrics.service.ts
@Injectable()
export class MetricsService {
  private readonly metrics = new Map<string, Histogram>();

  trackDuration(name: string, duration: number) {
    let metric = this.metrics.get(name);
    if (!metric) {
      metric = new Histogram({ name, buckets: [10, 50, 100, 200, 500] });
      this.metrics.set(name, metric);
    }
    metric.observe(duration);
  }

  getMetrics() {
    return Array.from(this.metrics.entries()).map(([name, metric]) => ({
      name,
      avg: metric.avg,
      p95: metric.percentile(95),
      p99: metric.percentile(99),
    }));
  }
}
```

### Performance Interceptor

```typescript
// src/interceptors/performance.interceptor.ts
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private metrics: MetricsService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now();
    
    try {
      return await next.handle().toPromise();
    } finally {
      const duration = Date.now() - start;
      const route = context.getHandler().name;
      this.metrics.trackDuration(route, duration);
    }
  }
}
```

## Best Practices

### Test Design
- Define SLAs
- Use realistic data
- Test incrementally
- Monitor resources
- Clean test data

### Performance Optimization
- Use indexes
- Optimize queries
- Implement caching
- Batch operations
- Use connection pools

### Resource Management
- Close connections
- Clean up resources
- Monitor memory
- Handle errors
- Use timeouts

### Monitoring
- Track metrics
- Set alerts
- Log performance
- Monitor trends
- Debug issues

## Common Issues

1. Database Performance
   - Missing indexes
   - N+1 queries
   - Large result sets
   - Connection limits
   - Lock contention

2. Memory Issues
   - Memory leaks
   - Large objects
   - Buffer bloat
   - Garbage collection
   - Memory fragmentation

3. Cache Problems
   - Cache invalidation
   - Cache stampede
   - Stale data
   - Memory pressure
   - Network latency

4. Concurrency Issues
   - Race conditions
   - Deadlocks
   - Resource contention
   - Thread starvation
   - Connection limits

## Next Steps

1. Set up performance testing
2. Define performance SLAs
3. Implement monitoring
4. Configure alerts
5. Document baselines 