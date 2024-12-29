# Test Infrastructure Migration

We're simply moving tests to use dedicated test instances of PostgreSQL and Redis to avoid conflicts with development instances.

## Required Changes

1. Update `.env.test` structure to match variables in `.env.sample`:
```
# Database (change port to use test instance)
DATABASE_PORT=5433

# Redis (change port to use test instance)
REDIS_PORT=6380
```

## Test Workflow
Same as before, just run:
```bash
docker compose down -v
docker compose up -d
npm run test
```

That's it! Everything else remains exactly the same. 