# E2E Testing Guide

This guide covers end-to-end testing strategies and implementation details.

## Overview

E2E tests validate complete business flows through the API, ensuring:
- API endpoints work as expected
- Authentication and authorization
- Database operations
- Cache interactions
- Real-world scenarios

## Test Structure

### Directory Organization
```
test/
├── helpers/
│   ├── auth.helper.ts
│   ├── permission-discovery.helper.ts
│   └── test-data.helper.ts
├── rbac/
│   └── permission.e2e-spec.ts
├── person/
│   └── person.e2e-spec.ts
├── auth/
│   └── auth.e2e-spec.ts
├── test-setup.ts
├── test-config.ts
└── jest-e2e.json
```

### Test File Structure
```typescript
import { TestSetup } from '../test-setup';
import { TestAuth } from '../helpers/auth.helper';

describe('Feature (e2e)', () => {
  let testSetup: TestSetup;

  // One-time setup
  beforeAll(async () => {
    testSetup = await new TestSetup().init();
  });

  // Clean state for each test
  beforeEach(async () => {
    await testSetup.cleanDb();
    await testSetup.setupPermissions();
  });

  // Cleanup
  afterAll(async () => {
    await testSetup.close();
  });

  // Test cases
  describe('POST /endpoint', () => {
    it('should handle happy path')
    it('should handle validation errors')
    it('should handle authorization')
  });
});
```

## Testing Patterns

### Authentication Flow
```typescript
describe('Authentication Flow', () => {
  it('should handle complete login-logout cycle', async () => {
    // Register
    const registerResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });
    expect(registerResponse.status).toBe(201);

    // Login
    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeDefined();

    // Use token
    const protectedResponse = await request(testSetup.app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);
    expect(protectedResponse.status).toBe(200);

    // Logout
    const logoutResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);
    expect(logoutResponse.status).toBe(200);

    // Token should be invalid
    const invalidTokenResponse = await request(testSetup.app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);
    expect(invalidTokenResponse.status).toBe(401);
  });
});
```

### RBAC Testing
```typescript
describe('RBAC', () => {
  it('should enforce role-based access', async () => {
    // Create roles with permissions
    const adminRole = await testSetup.prisma.role.create({
      data: {
        name: 'ADMIN',
        permissions: {
          create: [
            { permission: { connect: { code: 'person.manage' } } },
            { permission: { connect: { code: 'roles.manage' } } },
          ],
        },
      },
    });

    const userRole = await testSetup.prisma.role.create({
      data: {
        name: 'USER',
        permissions: {
          create: [
            { permission: { connect: { code: 'person.read' } } },
          ],
        },
      },
    });

    // Create people with different roles
    const adminPerson = await testSetup.prisma.person.create({
      data: {
        email: 'admin@test.com',
        roles: { connect: { id: adminRole.id } },
      },
    });

    const normalPerson = await testSetup.prisma.person.create({
      data: {
        email: 'person@test.com',
        roles: { connect: { id: userRole.id } },
      },
    });

    // Get tokens
    const adminToken = await TestAuth.getTokenForPerson(adminPerson);
    const userToken = await TestAuth.getTokenForPerson(normalPerson);

    // Admin should access protected endpoint
    await request(testSetup.app.getHttpServer())
      .post('/person')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new@test.com' })
      .expect(201);

    // User should be forbidden
    await request(testSetup.app.getHttpServer())
      .post('/person')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: 'new@test.com' })
      .expect(403);
  });
});
```

### Data Validation
```typescript
describe('Data Validation', () => {
  it('should validate request data', async () => {
    const adminToken = await TestAuth.loginAsAdmin(testSetup.app);

    // Test required fields
    await request(testSetup.app.getHttpServer())
      .post('/person')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400)
      .expect(res => {
        expect(res.body.message).toContain('email is required');
      });

    // Test invalid email
    await request(testSetup.app.getHttpServer())
      .post('/person')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'invalid' })
      .expect(400)
      .expect(res => {
        expect(res.body.message).toContain('invalid email');
      });

    // Test valid data
    await request(testSetup.app.getHttpServer())
      .post('/person')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'valid@test.com' })
      .expect(201);
  });
});
```

### Transaction Testing
```typescript
describe('Transactions', () => {
  it('should rollback on error', async () => {
    const adminToken = await TestAuth.loginAsAdmin(testSetup.app);

    // Create person with invalid role (should fail and rollback)
    await request(testSetup.app.getHttpServer())
      .post('/person')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'test@example.com',
        roles: ['INVALID_ROLE'],
      })
      .expect(400);

    // Verify person was not created
    const person = await testSetup.prisma.person.findUnique({
      where: { email: 'test@example.com' },
    });
    expect(person).toBeNull();
  });
});
```

### Cache Testing
```typescript
describe('Caching', () => {
  it('should handle cache invalidation', async () => {
    const adminToken = await TestAuth.loginAsAdmin(testSetup.app);

    // Get initial data (should cache)
    const initial = await request(testSetup.app.getHttpServer())
      .get('/person')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Create new person
    await request(testSetup.app.getHttpServer())
      .post('/person')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new@test.com' })
      .expect(201);

    // Get data again (should be fresh)
    const updated = await request(testSetup.app.getHttpServer())
      .get('/person')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(updated.body.length).toBe(initial.body.length + 1);
  });
});
```

## Best Practices

### Test Isolation
- Each test should be independent
- Clean database before each test
- Don't rely on test order
- Reset cache between tests
- Use unique data per test

### Performance
- Use transactions for faster cleanup
- Batch create test data
- Minimize database operations
- Cache test permissions
- Parallel test execution

### Maintainability
- Use test helpers and factories
- Keep tests focused and small
- Clear test descriptions
- Document complex scenarios
- Follow naming conventions

### Error Handling
- Test error scenarios
- Verify error messages
- Check error codes
- Test validation errors
- Test authorization errors

## Common Pitfalls

1. Database State
   - Not cleaning between tests
   - Relying on specific IDs
   - Missing foreign key data

2. Authentication
   - Missing tokens
   - Expired tokens
   - Wrong permissions

3. Race Conditions
   - Parallel test interference
   - Cache conflicts
   - Transaction isolation

4. Data Dependencies
   - Hard-coded test data
   - Missing required data
   - Invalid relationships

## Next Steps

1. Review [Contract Testing Guide](./contract-testing.md)
2. Study existing E2E tests
3. Add E2E tests for your features
4. Run E2E test suite
5. Monitor test coverage 