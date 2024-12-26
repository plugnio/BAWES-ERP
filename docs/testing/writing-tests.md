# Writing Tests Guide

This guide explains how to write effective tests following our best practices.

## Test Structure

### Basic Test Structure

```typescript
describe('ComponentName', () => {
  // Setup
  let service: TestService;
  let dependencies: MockDependencies;

  beforeAll(() => {
    // One-time setup
  });

  beforeEach(() => {
    // Reset before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  afterAll(() => {
    // Final cleanup
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = {};

      // Act
      const result = service.method(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Test Organization

```typescript
// Group related tests
describe('Authentication', () => {
  describe('Login', () => {
    describe('with valid credentials', () => {
      it('should return token')
      it('should set cookie')
    });

    describe('with invalid credentials', () => {
      it('should return 401')
      it('should not set cookie')
    });
  });
});
```

## Writing Different Test Types

### Unit Tests

```typescript
// src/users/services/user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Act
      const result = await service.createUser(userData);

      // Assert
      expect(result.password).not.toBe(userData.password);
      expect(await bcrypt.compare(userData.password, result.password)).toBe(true);
    });
  });
});
```

### Integration Tests

```typescript
// src/auth/auth.integration-spec.ts
describe('Auth Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
  });

  describe('Login Flow', () => {
    it('should handle complete login flow', async () => {
      // Create test user
      const user = await prisma.user.create({/*...*/});

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({/*...*/});

      // Verify token in Redis
      const cachedToken = await redis.get(`token:${user.id}`);
      expect(cachedToken).toBeDefined();

      // Use token for authenticated request
      const protectedResponse = await request(app.getHttpServer())
        .get('/protected')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);
      
      expect(protectedResponse.status).toBe(200);
    });
  });
});
```

### E2E Tests

```typescript
// test/users/users.e2e-spec.ts
describe('Users (e2e)', () => {
  let testSetup: TestSetup;

  beforeAll(async () => {
    testSetup = await new TestSetup().init();
  });

  beforeEach(async () => {
    await testSetup.cleanDb();
    await testSetup.setupPermissions();
  });

  describe('POST /users', () => {
    it('should create user with proper permissions', async () => {
      // Login as admin
      const adminToken = await TestAuth.loginAsAdmin(testSetup.app);

      // Create user
      const response = await request(testSetup.app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test@example.com',
          roles: ['USER'],
        })
        .expect(201);

      // Verify user in database
      const user = await testSetup.prisma.user.findUnique({
        where: { id: response.body.id },
        include: { roles: true },
      });

      expect(user).toBeDefined();
      expect(user.roles[0].name).toBe('USER');
    });
  });
});
```

## Testing Patterns

### Testing Permissions

```typescript
describe('Permission Testing', () => {
  it('should require specific permission', async () => {
    // Create tokens with different permissions
    const tokenWithPermission = await TestAuth.getTestToken(['users.create']);
    const tokenWithoutPermission = await TestAuth.getTestToken(['other.permission']);

    // Should succeed with correct permission
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${tokenWithPermission}`)
      .expect(201);

    // Should fail without permission
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${tokenWithoutPermission}`)
      .expect(403);
  });
});
```

### Testing Financial Calculations

```typescript
describe('Financial Calculations', () => {
  it('should handle currency operations precisely', () => {
    const amount1 = new Decimal('10.99');
    const amount2 = new Decimal('20.01');
    
    const result = financialService.add(amount1, amount2);
    
    expect(result.toString()).toBe('31.00');
    expect(result instanceof Decimal).toBe(true);
  });

  it('should round according to currency rules', () => {
    const amounts = ['10.999', '10.991', '10.995'];
    const expected = ['11.00', '10.99', '11.00'];

    amounts.forEach((amount, index) => {
      const result = financialService.round(new Decimal(amount));
      expect(result.toString()).toBe(expected[index]);
    });
  });
});
```

### Testing Cache Behavior

```typescript
describe('Cache Testing', () => {
  it('should cache and return cached results', async () => {
    // First call - should hit database
    const result1 = await service.getCachedData();
    expect(mockPrisma.findMany).toHaveBeenCalled();

    // Second call - should use cache
    const result2 = await service.getCachedData();
    expect(mockPrisma.findMany).toHaveBeenCalledTimes(1);
    expect(result2).toEqual(result1);
  });

  it('should invalidate cache when needed', async () => {
    // Cache some data
    await service.getCachedData();

    // Update data
    await service.updateData();

    // Should hit database again
    await service.getCachedData();
    expect(mockPrisma.findMany).toHaveBeenCalledTimes(2);
  });
});
```

## Best Practices

### Testing Async Code

```typescript
// Always await async operations
it('should handle async operations', async () => {
  await expect(asyncFunction()).resolves.toBe(expected);
  await expect(failingFunction()).rejects.toThrow();
});
```

### Testing Errors

```typescript
describe('Error Handling', () => {
  it('should handle specific errors', async () => {
    // Arrange
    mockService.method.mockRejectedValue(new SpecificError());

    // Act & Assert
    await expect(async () => {
      await service.method();
    }).rejects.toThrow(SpecificError);
  });

  it('should return proper error response', async () => {
    const response = await request(app.getHttpServer())
      .post('/endpoint')
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'ValidationError',
      message: expect.any(String),
    });
  });
});
```

### Testing Edge Cases

```typescript
describe('Edge Cases', () => {
  it.each([
    [null, 'should handle null'],
    [undefined, 'should handle undefined'],
    ['', 'should handle empty string'],
    [{}, 'should handle empty object'],
  ])('when input is %p, %s', (input, _description) => {
    expect(() => service.method(input)).not.toThrow();
  });
});
```

## Next Steps

1. Review [E2E Testing Guide](./e2e-testing.md)
2. Study existing tests in the codebase
3. Write tests for your components
4. Run coverage reports
5. Get your tests reviewed 