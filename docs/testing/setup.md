# Test Setup Guide

This guide explains how to set up and configure the testing environment.

## Prerequisites

- Node.js 18+
- Docker
- PostgreSQL (via Docker)
- Redis (via Docker)

## Initial Setup

1. Install dependencies:
```bash
npm install
```

2. Start test infrastructure:
```bash
docker-compose up -d
```

3. Set up test environment:
```bash
# Copy example env
cp .env.example .env.test

# Update test database URL
DATABASE_URL="postgresql://erpuser:erppassword@localhost:5432/erp_db_test?schema=public"
```

## Test Database

The test database is automatically:
- Created by Prisma when needed
- Migrated to latest schema
- Cleaned between tests
- Isolated from development/production

### Database Configuration

```typescript
// test/test-config.ts
export const TestConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env.test',
});

// Prisma will use DATABASE_URL from .env.test
```

### Database Cleanup

```typescript
// test/test-setup.ts
export class TestSetup {
  async cleanDb() {
    // Clean all tables before each test
    const prisma = await getTestPrismaService();
    // ... cleanup logic
  }
}
```

## Test Utilities

### Base Test Setup

```typescript
// test/test-setup.ts
export class TestSetup {
  app: INestApplication;
  prisma: PrismaService;

  async init() {
    // Initialize test app
    const moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, AppModule],
    }).compile();

    this.app = moduleRef.createNestApplication();
    await this.app.init();
    
    // Set up test database
    this.prisma = await getTestPrismaService();
    
    return this;
  }
}
```

### Permission Testing

```typescript
// test/helpers/permission-discovery.helper.ts
export async function discoverActualPermissions() {
  // Discover permissions from code
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const discoveryService = moduleRef.get(PermissionDiscoveryService);
  return await discoveryService.discoverPermissions();
}
```

### Authentication Helper

```typescript
// test/helpers/auth.helper.ts
export class TestAuth {
  static async getTestToken(permissions: string[]) {
    // Generate test JWT with permissions
    return jwt.sign({ permissions }, TEST_JWT_SECRET);
  }

  static async loginAsAdmin(app: INestApplication) {
    // Login as admin for testing
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ /* admin credentials */ });
    return response.body.token;
  }
}
```

## Test Data Factories

### User Factory

```typescript
// test/factories/user.factory.ts
export class UserFactory {
  static async create(prisma: PrismaService, overrides = {}) {
    return prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        ...overrides,
      },
    });
  }
}
```

### Permission Factory

```typescript
// test/factories/permission.factory.ts
export class PermissionFactory {
  static async createMany(prisma: PrismaService, count: number) {
    const permissions = [];
    for (let i = 0; i < count; i++) {
      permissions.push({
        code: `test.permission${i}`,
        name: `Test Permission ${i}`,
        category: 'test',
        bitfield: (2n ** BigInt(i)).toString(),
      });
    }
    return prisma.permission.createMany({ data: permissions });
  }
}
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test src/path/to/file.spec.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

### E2E Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific e2e test
npm run test:e2e test/path/to/file.e2e-spec.ts
```

### Contract Tests

```bash
# Test SDK generation
npm run test:sdk

# Check breaking changes
npm run check:breaking-changes
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres
        env:
          POSTGRES_USER: erpuser
          POSTGRES_PASSWORD: erppassword
          POSTGRES_DB: erp_db_test
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

## Debugging Tests

### VS Code Configuration

```jsonc
// .vscode/launch.json
{
  "configurations": [
    {
      "type": "node",
      "name": "Debug Tests",
      "request": "launch",
      "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/jest",
      "args": ["--runInBand", "--watchAll=false"],
      "cwd": "${workspaceRoot}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Test Debugging Tips

1. Use `console.log` for quick debugging
2. Set breakpoints in VS Code
3. Use `test:debug` script
4. Check test database state
5. Inspect HTTP responses
6. Review test logs

## Next Steps

1. Read [Writing Tests Guide](./writing-tests.md)
2. Set up your IDE for testing
3. Write your first test
4. Run the test suite
5. Review test coverage 